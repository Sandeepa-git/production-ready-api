const errorMiddleware = (err, req, res, next) => {
    try {
        let error = { ...err };

        error.message = err.message;
        error.name = err.name; // Explicitly preserve name

        console.error('Error caught in error middleware:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);

        //Momgoose bad ObjectId
        if (error.name === 'CastError') {
            const message = `Resource not found with id of ${err.value}`;
            error = new Error(message);
            error.statusCode = 404;
        }

        //Mongoose duplicated key
        if (error.code === 11000) {
            const message = 'Duplicate field value entered';
            error = new Error(message);
            error.statusCode = 400;
        }
        //Mongoose validation error
        if (error.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            error = new Error(message.join(', '));
            error.statusCode = 400;
        }

        res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || 'Server Error'
        });

    } catch (error) {
        console.error('Error in error middleware:', error);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

export default errorMiddleware;