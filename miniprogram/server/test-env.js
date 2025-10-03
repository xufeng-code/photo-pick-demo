require('dotenv').config();

console.log('环境变量测试:');
console.log('PORT:', process.env.PORT);
console.log('BASE_URL:', process.env.BASE_URL);
console.log('PUBLIC_BASE:', process.env.PUBLIC_BASE);
console.log('NODE_ENV:', process.env.NODE_ENV);