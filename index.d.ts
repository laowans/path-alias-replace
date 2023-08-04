import { WatchOptions } from 'chokidar';

/**
 * 监控配置项
 */
export interface WatchOpitons {
	/**
	 * 是否输出监控信息，默认：true
	 */
	outputMsg?: boolean;
	/**
	 * 忽略文件
	 */
	ignored?: WatchOptions['ignored'];
}

export declare interface Options {
	/**
	 * 扫描路径
	 */
	sweepPath: string;
	/**
	 * 别名
	 */
	alias: {
		[key: string]: string;
	};
	/**
	 * 需要替换的文件类型，默认：['js']
	 */
	ext?: string[];
	/**
	 * 输出路径(将替换好的文件输出到指定目录)
	 */
	outputPath?: string;
	/**
	 * 输出路径不存在则创建，默认：true
	 */
	createOutputPath?: boolean;
	/**
	 * 匹配 require 导入，默认：true
	 */
	require?: boolean;
	/**
	 * 匹配 import 导入，默认：true
	 */
	import?: boolean;
	/**
	 * import 导入是否自动添加扩展名，默认：['js', 'mjs', 'json', 'node']
	 */
	importAutoAddExtension?: string[];
	/**
	 * 输出替换信息，默认：opitons.watch ? false : true
	 */
	outputReplacementInfo?: boolean;
	/**
	 * 是否开始监控
	 */
	watch?: boolean;
	/**
	 * 监控配置项
	 */
	watchOpitons?: WatchOpitons & {
		/**
		 * 监控目录，默认为 sweepPath
		 */
		watchPath?: string;
		/**
		 * 替换前执行命令
		 */
		rbefore?: string;
		/**
		 * 替换后执行命令
		 */
		rafter?: string;
		/**
		 * rbefore 环境变量
		 */
		rbeforeEnv?: {
			[k: string]: string;
		};
		/**
		 * rafter 环境变量
		 */
		rafterEnv?: {
			[k: string]: string;
		};
	};
}

export declare function pathAliasReplace(options: Options): void;

export declare function deleteFolderRecursive(folderPath: string): void;
