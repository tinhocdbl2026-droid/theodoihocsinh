/**
 * Utilities for Vietnamese text normalization, accent-insensitive search,
 * and proper Vietnamese alphabetical sorting (by First Name, then Middle/Last).
 */

export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function searchVietnamese(query: string, target: string): boolean {
  if (!query) return true;
  if (!target) return false;
  const normalizedQuery = removeVietnameseAccents(query);
  const normalizedTarget = removeVietnameseAccents(target);
  return normalizedTarget.includes(normalizedQuery);
}

/**
 * Split Vietnamese full name into Last/Middle Name and First Name (Tên chính)
 * e.g. "Nguyễn Văn An" -> First name: "An", Last/Middle: "Nguyễn Văn"
 */
export function getVietnameseNameParts(fullName: string): { firstName: string; restName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: fullName, restName: '' };
  }
  const firstName = parts[parts.length - 1];
  const restName = parts.slice(0, parts.length - 1).join(' ');
  return { firstName, restName };
}

/**
 * Compare two Vietnamese names properly (sort by Tên first, then Họ & Tên đệm)
 */
export function compareVietnameseNames(nameA: string, nameB: string): number {
  const partsA = getVietnameseNameParts(nameA);
  const partsB = getVietnameseNameParts(nameB);

  const cmpFirst = partsA.firstName.localeCompare(partsB.firstName, 'vi', { sensitivity: 'base' });
  if (cmpFirst !== 0) return cmpFirst;

  return partsA.restName.localeCompare(partsB.restName, 'vi', { sensitivity: 'base' });
}
