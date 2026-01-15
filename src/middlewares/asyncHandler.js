// hàm này nhận vào 1 async fn và trả về một middle ware mới

const asyncHandler = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    };
};

module.exports = asyncHandler;