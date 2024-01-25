process.chdir(import.meta.dirname);

process.chdir("../..")

import {$} from 'execa';

await $({stdin:"inherit",stdout:"inherit",stderr:"inherit"})`./mach run`;