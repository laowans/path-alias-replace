import { pathAliasReplace } from '../src';
import path from 'path';
import { Options } from '../index';

const path1 = path.join(__dirname, './t');
const path2 = path.join(__dirname, '../temp');

const options: Options = {
	sweepPath: path1,
	alias: {
		'@': path1,
	},
	outputPath: path2,
};

pathAliasReplace(options);
