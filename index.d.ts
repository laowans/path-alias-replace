import { WatchOptions } from 'chokidar';
import { ProcessEnvOptions } from 'child_process';

/**
 * 监控配置项
 */
export interface WatchOpitons {
	/**
	 * 是否输出监控信息
	 * @default true
	 */
	outputMsg?: boolean;

	/**
	 * 忽略文件
	 */
	ignored?: WatchOptions['ignored'];

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
	rbeforeEnv?: ProcessEnvOptions['env'];

	/**
	 * rafter 环境变量
	 */
	rafterEnv?: ProcessEnvOptions['env'];

	/**
	 * rbefore cwd
	 */
	rbeforeCwd?: ProcessEnvOptions['cwd'];

	/**
	 * rafter cwd
	 */
	rafterCwd?: ProcessEnvOptions['cwd'];

	/**
	 * 是否在初始化时执行 rbefore
	 * @default true
	 */
	rbeforeImmediate?: boolean;

	/**
	 * 是否在初始化时执行 rafter
	 * @default true
	 */
	rafterImmediate?: boolean;

	/**
	 * 是否在终端监控 /r 的输入并重新执行替换和rbefore、rafter
	 * @default true
	 */
	'/r'?: boolean;
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
	 * 需要替换的文件类型
	 * @default ['js']
	 */
	ext?: string[];

	/**
	 * 输出路径(将替换好的文件输出到指定目录)
	 */
	outputPath?: string;

	/**
	 * 输出路径不存在则创建
	 * @default true
	 */
	createOutputPath?: boolean;

	/**
	 * 匹配 require 导入
	 * @default true
	 */
	require?: boolean;

	/**
	 * 匹配 import 导入
	 * @default true
	 */
	import?: boolean;

	/**
	 * import 导入是否自动添加扩展名，默认
	 * @default ['js','mjs','json','node']
	 */
	importAutoAddExtension?: string[];

	/**
	 * 输出替换信息
	 * @default opitons.watch?false:true
	 */
	outputReplacementInfo?: boolean;

	/**
	 * 是否开始监控
	 * @default false
	 */
	watch?: boolean;

	/**
	 * 监控配置项
	 */
	watchOpitons?: WatchOpitons & {
		/**
		 * 监控目录
		 * @default options.sweepPath
		 */
		watchPath?: string;
	};
}

/**
 * 路径别名替换
 */
export declare function pathAliasReplace(options: Options): void;

/**
 * 删除指定目录下的的所有文件和文件夹
 * 用的时候一定注意路径，
 */
export declare function deleteFolderRecursive(folderPath: string): void;
