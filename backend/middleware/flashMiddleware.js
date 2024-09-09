// flashMiddleware.js
import flash from 'express-flash';

const flashMiddleware = (req, res, next) => {
    // Check if there is a flash message stored in the session
    if (req.session.flash) {
        // Store the flash messages in locals
        res.locals.errorFlash = req.flash('error');
        res.locals.successFlash = req.flash('success');
    }
    next();
};

export default flashMiddleware;