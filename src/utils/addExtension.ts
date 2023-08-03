import fs from 'fs';
import path from 'path';

/**
 * 添加路径扩展名
 */
export function addExtension(importPath: string, ext: string[]) {
	const exists = fs.existsSync(importPath);
	const isDir = exists ? fs.statSync(importPath).isDirectory() : false;
	const result = {
		change: false,
		newImportPath: importPath,
	};

	if (!(exists && !isDir)) {
		if (exists && isDir) {
			for (let i = 0; i < ext.length; i++) {
				const extPath = path.join(importPath, 'index.' + ext[i]);

				if (fs.existsSync(extPath)) {
					result.change = true;
					result.newImportPath = extPath;
					break;
				}
			}
		} else {
			for (let i = 0; i < ext.length; i++) {
				const extPath = importPath + '.' + ext[i];

				if (fs.existsSync(extPath)) {
					result.change = true;
					result.newImportPath = extPath;
				}
			}
		}
	}

	return result;
}
