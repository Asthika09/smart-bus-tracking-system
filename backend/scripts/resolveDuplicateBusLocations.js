require("dotenv").config();
const mongoose = require("mongoose");
const BusLocation = require("../models/BusLocation");
const normalizeBusNumber = require("../utils/normalizeBusNumber");

async function resolveDuplicateBusLocations(options = {}) {
  const {
    dryRun = true,
    keepLatest = true,
    backupCollectionName = "busLocationDuplicateBackups",
    requireConfirmation = false,
    confirmValue = "CONFIRM",
    createUniqueIndexAfterCleanup = false
  } = options;

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (requireConfirmation && process.env.MONGO_RESOLVE_DUPLICATES !== confirmValue) {
    throw new Error(
      `Set MONGO_RESOLVE_DUPLICATES=${confirmValue} to confirm duplicate BusLocation cleanup.`
    );
  }

  const db = mongoose.connection.db;
  const busLocationCollection = db.collection("buslocations");
  const backupCollection = db.collection(backupCollectionName);

  const duplicateGroups = await busLocationCollection.aggregate([
    {
      $match: {
        busNumber: { $exists: true, $ne: null, $ne: "" }
      }
    },
    {
      $group: {
        _id: {
          busNumber: { $toUpper: "$busNumber" }
        },
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        $expr: { $gt: [{ $size: "$docs" }, 1] }
      }
    }
  ]).toArray();

  if (duplicateGroups.length === 0) {
    console.log("No duplicate BusLocation records found.");
    return { duplicatesResolved: 0, backupsCreated: 0 };
  }

  let totalBackups = 0;

  for (const group of duplicateGroups) {
    const normalizedValue = normalizeBusNumber(group._id.busNumber);
    const docs = group.docs
      .map((doc) => ({ ...doc, busNumber: normalizeBusNumber(doc.busNumber) }))
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a._id.getTimestamp()).getTime();
        const bTime = new Date(b.updatedAt || b._id.getTimestamp()).getTime();
        return bTime - aTime;
      });

    const keepDoc = keepLatest ? docs[0] : docs[docs.length - 1];
    const duplicateDocs = docs.filter((doc) => doc._id.toString() !== keepDoc._id.toString());

    if (duplicateDocs.length === 0) {
      continue;
    }

    if (!dryRun) {
      const backupDocs = duplicateDocs.map((doc) => ({
        _sourceId: doc._id,
        busNumber: normalizedValue,
        originalDocument: doc,
        backedUpAt: new Date()
      }));

      if (backupDocs.length > 0) {
        const result = await backupCollection.insertMany(backupDocs);
        totalBackups += result.insertedCount;
      }

      const duplicateIds = duplicateDocs.map((doc) => doc._id);
      await busLocationCollection.deleteMany({ _id: { $in: duplicateIds } });

      await busLocationCollection.updateOne(
        { _id: keepDoc._id },
        {
          $set: {
            busNumber: normalizeBusNumber(keepDoc.busNumber),
            updatedAt: keepDoc.updatedAt || new Date()
          }
        }
      );
    }

    console.log(
      `Prepared duplicate cleanup for ${normalizedValue}: kept ${keepDoc._id.toString()} and backed up ${duplicateDocs.length} records.`
    );
  }

  if (createUniqueIndexAfterCleanup && !dryRun) {
    await busLocationCollection.createIndex({ busNumber: 1 }, { unique: true, name: "busNumber_unique" });
    console.log("Created unique index on busNumber after duplicate cleanup.");
  }

  return {
    duplicatesResolved: duplicateGroups.reduce((sum, group) => sum + Math.max(0, group.docs.length - 1), 0),
    backupsCreated: totalBackups,
    uniqueIndexCreated: createUniqueIndexAfterCleanup && !dryRun
  };
}

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      const result = await resolveDuplicateBusLocations({
        dryRun: process.env.MONGO_RESOLVE_DUPLICATES !== "true",
        requireConfirmation: true,
        confirmValue: "CONFIRM",
        createUniqueIndexAfterCleanup: process.env.MONGO_CREATE_UNIQUE_INDEX === "true"
      });

      console.log("Duplicate resolution summary:", result);
      await mongoose.disconnect();
    } catch (error) {
      console.error("Duplicate cleanup failed:", error.message);
      process.exitCode = 1;
    }
  })();
}

module.exports = { resolveDuplicateBusLocations };
