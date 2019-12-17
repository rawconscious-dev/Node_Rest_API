module.exports = (app) => {
    const caterer_controller = require('../controllers/caterer.controller');
    const upload = require('../config/caterer_image.config.js');

    const { body } = require("express-validator");

    // caterer Registration
    app.post('/api/caterer_signup',
    //validators for request body fields
    //[
    //   body("name", "Invalid name, enter 1 to 15 characters only")
    //     .trim()
    //     .isLength({ min: 1, max: 15 }),
    //   body("description", "Invalid Description, enter 1 to 50 characters")
    //     .trim()
    //     .isLength({ min: 1, max: 50 }),
    //   body(
    //     "password",
    //     "Password should be combination of one uppercase , one lower case, one special char, one digit and min 8 , max 15 char long"
    //   ).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/, "i"),
    //   body("email", "Enter valid email").isEmail(),
    //   body("phone", "Enter a valid phone number").isMobilePhone().isLength({ min: 10, max: 10 })
    //]
     upload.single('image'), caterer_controller.signup);

    // caterer Login
    app.post('/api/caterer_login', caterer_controller.login)

    // caterer Details
    app.get('/api/caterer_details/:id', caterer_controller.caterer_details)

    // All caterers
    app.get('/api/caterers', caterer_controller.caterers)

    // Update caterer
    app.put('/api/update_caterer/:id', caterer_controller.update_caterer);

    // Delete caterer
    app.delete('/api/delete_caterer/:id', caterer_controller.delete_caterer);
    
}