// filenameSanitizer.ts

import * as path from "path";

const INVALID_CHARS_REGEX = /[<>:"/\\|?*\p{C}]/gu;

// Define reserved names (case-insensitive)
const RESERVED_NAMES = new Set<string>([
	"CON",
	"PRN",
	"AUX",
	"NUL",
	"COM1",
	"COM2",
	"COM3",
	"COM4",
	"COM5",
	"COM6",
	"COM7",
	"COM8",
	"COM9",
	"LPT1",
	"LPT2",
	"LPT3",
	"LPT4",
	"LPT5",
	"LPT6",
	"LPT7",
	"LPT8",
	"LPT9",
]);

/**
 * Checks if a given name is a reserved Windows name.
 * @param name The base name to check.
 * @returns True if it's reserved, otherwise false.
 */
function isReservedName(name: string): boolean {
	return RESERVED_NAMES.has(name.toUpperCase());
}

/**
 * Sanitizes a filename for Windows file system compatibility while preserving case sensitivity.
 * @param originalName The original filename to sanitize.
 * @returns The sanitized filename.
 */
export function sanitizeFilename(originalName: string): string {
	// Step 1: Parse the filename using path.parse
	const parsedPath = path.parse(originalName);
	let baseName = parsedPath.name;
	let extension = parsedPath.ext.slice(1); // Remove the dot from extension

	// Step 2: Handle Reserved Names
	if (isReservedName(baseName)) {
		baseName = `_${baseName}`;
	}

	// Step 3: Replace invalid characters with underscore
	baseName = baseName.replace(INVALID_CHARS_REGEX, "_");
	extension = extension.replace(INVALID_CHARS_REGEX, "_");

	// Step 4: Escape existing '__U__' sequences to prevent conflicts
	const escapeMarkers = (s: string): string => {
		return s.replace(/__U__/g, "__E__U__");
	};

	baseName = escapeMarkers(baseName);
	extension = escapeMarkers(extension);

	// Step 5: Encode case information
	// Prefix uppercase letters with '__U__' and keep them uppercase
	const encodeCase = (s: string): string => {
		return s.replace(/([A-Z])/g, "__U__$1");
	};

	baseName = encodeCase(baseName);
	extension = encodeCase(extension);

	// Step 6: Ensure name doesn't end with space or period
	baseName = baseName.replace(/\.+$/, ""); // Remove trailing periods only
	extension = extension.replace(/\.+$/, ""); // Remove trailing periods only

	// Step 7: Combine base name and extension
	const sanitized = extension ? `${baseName}.${extension}` : baseName;

	return sanitized;
}

/**
 * Restores the original filename from its sanitized version.
 * @param sanitizedName The sanitized filename.
 * @returns The original filename.
 */
export function restoreFilename(sanitizedName: string): string {
	// Step 1: Parse the sanitized filename
	const parsedPath = path.parse(sanitizedName);
	let baseName = parsedPath.name;
	let extension = parsedPath.ext.slice(1); // Remove the dot

	// Step 2: Decode case information
	// Replace '__U__X' with uppercase 'X'
	const decodeCase = (s: string): string => {
		return s.replace(/__U__([A-Z])/g, (_, p1) => p1.toUpperCase());
	};

	baseName = decodeCase(baseName);
	extension = decodeCase(extension);

	// Step 3: Unescape '__E__U__' sequences back to '__U__'
	const unescapeMarkers = (s: string): string => {
		return s.replace(/__E__U__/g, "__U__");
	};

	baseName = unescapeMarkers(baseName);
	extension = unescapeMarkers(extension);

	// Step 4: Restore Reserved Names by removing the prefix underscore if present
	if (baseName.startsWith("_")) {
		const potentialReserved = baseName.substring(1);
		if (isReservedName(potentialReserved)) {
			baseName = potentialReserved;
		}
	}

	// Step 5: Combine base name and extension
	const restored = extension ? `${baseName}.${extension}` : baseName;

	return restored;
}
