const { join } = require('path');
const { deleteFolderRecursive } = require('../');

// 打包前删除输出目录下的所有文件
deleteFolderRecursive(join(__dirname, '../dist'));
