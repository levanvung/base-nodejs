const jwt = require('jsonwebtoken');
const ErrorResponse = require('@/utils/error.response')
const prisma = require('@/dbs/init.prisma.js');


const verifyToken = async (req, res, next) => {
    let token; 
    // lấy tokenj từ header

    // client gửi dạng auth bear

    if(req.headers.authorization && req.headers.authorization.startWith('Bearer'))
    {
        token = req.headres.authorization.split('')[1]; // lấy phần token sau chữ bearer
    }
    if(!token) {
        return next(new ErrorResponse('Không tìm thấy Token , Vui lòng đăng nhập', 401))
    }
    try {
        // very file txem token có phải do mình ký không, có hết hạn không
        const secretKey = process.env.JWT_ACCESS_KEY;
        const decoded = jwt.verify(token, secretKey);

        // de conde chính là pyaload chúng ta đã sign chứa id emaiil user name 

        // check xem user trong token còn tồn tiaijt rong db không

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
            }
        });

        if(!user){
            return next(new ErrorResponse('User không tồn tại ', 401))
        }

        // gán user vào req để các route sau có thể dùng
        req.user = user;
        next();


    }catch(error){
        return next(new ErrorResponse('Token không hợp lệ hoặc đã hết hạn', 401));
    }
}
module.exports = {verifyToken};