// import 语法，别名测试，加添扩展名测试
import sa from '@/b';
import { aa } from '@/b';
import '@/b';
import('@/b');
export * from '@/b';

// 加添 index + 扩展名测试
import '@/dir';
import './dir';

// 测试完整的扩展名看是否会改变
import './dir/index.js';
// 带别名
import '@/dir/index.js';

// 导入路径只有别名的情况
import '$c';
import '$dir';
