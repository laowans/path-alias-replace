import path from 'path';
import { ChildProcess, execSync } from 'child_process';
import { isWindows } from './env';

export function kill(child: ChildProcess, callback?: Function) {
	if (!callback) {
		callback = () => {};
	}

	if (isWindows) {
		try {
			execSync('taskkill /pid ' + child.pid + ' /T /F');
			callback();
		} catch (e: any) {
			throw e;
		}
	} else {
		child.kill();
		callback();
	}
}
