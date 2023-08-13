import fs from 'fs';
import path from 'path';

/**
 * 添加路径扩展名
 */
export function addExtension(importPath: string, ext: string[]) {
	const exists = fs.existsSync(importPath);
	const isDir = exists ? fs.statSync(importPath).isDirectory() : false;
	const result = {
		change: false, // 路径是否改变
		newImportPath: importPath, // 新的导入路径
	};

	// 排除导入路径存在且不为文件夹的情况
	if (!exists || isDir) {
		for (let i = 0; i < ext.length; i++) {
			// 默认加上 `.${ext}`
			let extPath: string = importPath + '.' + ext[i];
			// 路径存在且为文件夹，则组合路径 `index.${ext}`
			if (exists && isDir) extPath = path.join(importPath, 'index.' + ext[i]);

			if (fs.existsSync(extPath)) {
				result.change = true;
				result.newImportPath = extPath;
				break;
			}
		}
	}

	return result;
}
