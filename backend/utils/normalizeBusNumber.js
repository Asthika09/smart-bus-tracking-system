function normalizeBusNumber(busNumber) {
  if (busNumber === undefined || busNumber === null) {
    return null;
  }

  const normalized = String(busNumber).trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("BUS-")) {
    const numericPart = normalized.replace(/^BUS-/, "");

    if (/^\d+$/.test(numericPart)) {
      return `BUS-${numericPart.padStart(3, "0")}`;
    }

    return normalized;
  }

  if (/^\d+$/.test(normalized)) {
    return `BUS-${normalized.padStart(3, "0")}`;
  }

  return normalized;
}

module.exports = normalizeBusNumber;
