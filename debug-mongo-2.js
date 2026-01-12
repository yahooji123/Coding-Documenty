const Pkg = require('connect-mongo');
console.log('Pkg keys:', Object.keys(Pkg));
console.log('Pkg.default.create:', typeof Pkg.default.create);
console.log('Pkg.MongoStore.create:', typeof Pkg.MongoStore.create);
