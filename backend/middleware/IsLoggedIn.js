// isLoggedIn.js

// Middleware function to check if the user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.username) {
        console.log("authenticated");
        next();
    } else {
        // User is not logged in, redirect to the login page
        req.session.flashMessage = 'Please log in to access this page.';

        res.redirect('/login.html');
        
    }
};

// Export the middleware function
export default isLoggedIn;