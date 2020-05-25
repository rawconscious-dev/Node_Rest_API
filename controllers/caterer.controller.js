const HttpStatus = require("http-status-codes");
//import Caterer model
const Caterer = require("../models/Caterer");
//jsonwebtokens module for generating auth tokens
const jwt = require("jsonwebtoken");
// module to upload images to the cloudinary
const cloudinary = require("cloudinary");
//module to catch request validation Result
const { validationResult } = require("express-validator");
//variables
var imgUrl = null;
var urlImage = null;

// Image Upload
const uploadImage = async (image) => {
  console.log("Image is " + image);
  imgUrl = await cloudinary.uploader.upload(
    //image path
    image,
    //cloudinary destination folder
    { folder: "user_images/" },
    //call back on success
    (result) => {
      console.log(result.url);
      return result.url;
    },
    //call back on error
    (err) => {
      console.log("Error is here " + err);
    }
  );
  return imgUrl;
};

// Caterer Registration
exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: "Server side validation failed",
      errors: errors.array(),
    });
  }

  console.log(req.body);
  //variable to store image file path
  var imageFile = null;
  //check if an image file was uploaded
  if (req.file) {
    imageFile = req.file.path;
  }

  if (imageFile !== null) {
    console.log("Yes Image is here " + imageFile);
    await uploadImage(imageFile);
    // console.log(imgUrl.url);
    urlImage = imgUrl.url;
  } else {
    console.log("No Image");
    urlImage = "";
  }

  // Check if Caterer Already Exists with same Email
  await Caterer.find({ email: req.body.email })
    .then((count) => {
      if (count.length > 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Email Already Exists",
          errors: [],
        });
      } else {
        const caterer = new Caterer({
          name: req.body.name,
          description: req.body.description,
          email: req.body.email,
          password: req.body.password,
          phone: req.body.phone,
          minimum_order_quantity: req.body.minimum_order_quantity,
          lead_time: req.body.lead_time,
          availability: req.body.availability,
          menu_starting_from: req.body.menu_starting_from,
          delivery_fee: req.body.delivery_fee,
          live_kitchen: req.body.live_kitchen,
          image: urlImage,
        });

        // Register Caterer

        return caterer.save();
      }
    })
    .then((caterer) => {
      const token = jwt.sign(
        { email: caterer.email, userId: caterer._id },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: "1h" }
      );
      res.json({
        message: "Caterer Registered Successfully",
        token: token,
      });
    })
    .catch((err) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        errors: err,
      });
    });
};

// Caterer Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: "Server side validation failed",
      errors: errors.array(),
    });
  }
  await Caterer.findOne({
    $or: [
      {
        $and: [{ email: req.body.email }, { password: req.body.password }],
      },
      {
        $and: [{ phone: req.body.phone }, { password: req.body.password }],
      },
    ],
  })
    .then((result) => {
      // console.log(result);
      if (result) {
        const token = jwt.sign(
          { email: result.email, userId: result._id },
          process.env.JWT_PRIVATE_KEY,
          { expiresIn: "1h" }
        );
        // If Caterer Exists
        res.json({
          message: "Login Successfull",
          token: token,
        });
      } else {
        // If Caterer doesn't Exists
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Caterer Email or Password not registered",
          errors: [],
        });
      }
    })
    .catch((err) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        errors: err,
      });
    });
};

// Caterer Details
exports.caterer_details = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: "Server side validation failed",
      errors: errors.array(),
    });
  }
  await Caterer.findOne({ _id: req.body.userId })
    .then((result) => {
      if (result) {
        res.json({
          message: "Caterer Found",
          caterer: result,
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Caterer Not Found",
          errors: [],
        });
      }
    })
    .catch((err) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        errors: err,
      });
    });
};

// Fetch All Caterers
exports.caterers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: "Server side validation failed",
      errors: errors.array(),
    });
  }
  let query = { availability: true };
  const operator = "$and";
  if (req.body.location) {
    // console.log(req.body);
    query["serviceableArea"] = req.body.location;
  }
  if (req.body.cateringType) {
    if (query[operator]) {
      query[operator].push({ cateringType: { $in: req.body.cateringType } });
    } else {
      query[operator] = [{ cateringType: { $in: req.body.cateringType } }];
    }
  }
  if (req.body.dietary) {
    if (query[operator]) {
      query[operator].push({ dietaryRestrictions: { $in: req.body.dietary } });
    } else {
      query[operator] = [{ dietaryRestrictions: { $in: req.body.dietary } }];
    }
  }
  if (req.body.cuisine) {
    if (query[operator]) {
      query[operator].push({ cuisineType: { $in: req.body.cuisine } });
    } else {
      query[operator] = [{ cuisineType: { $in: req.body.cuisine } }];
    }
  }
  if (req.body.vendorType) {
    if (query[operator]) {
      query[operator].push({ vendorType: { $in: req.body.vendorType } });
    } else {
      query[operator] = [{ vendorType: { $in: req.body.vendorType } }];
    }
  }
  if (req.body.event) {
    if (query[operator]) {
      query[operator].push({ event: { $in: req.body.event } });
    } else {
      query[operator] = [{ event: { $in: req.body.event } }];
    }
  }
  if (req.body.dish) {
    if (query[operator]) {
      query[operator].push({ dish: { $in: req.body.dish } });
    } else {
      query[operator] = [{ dish: { $in: req.body.dish } }];
    }
  }
  if (req.body.corporateEvent) {
    if (query[operator]) {
      query[operator].push({
        corporateEvent: { $in: req.body.corporateEvent },
      });
    } else {
      query[operator] = [{ corporateEvent: { $in: req.body.corporateEvent } }];
    }
  }
  if (req.body.name) {
    if (query[operator]) {
      query[operator].push({
        name: { $in: req.body.name },
      });
    } else {
      query[operator] = [{ name: { $in: req.body.name } }];
    }
  }
  // console.log(query);
  await Caterer.find(query)
    .select("-email -phone")
    .populate(
      "serviceableArea cateringType dietaryRestrictions cuisineType vendorType event"
    )
    .then((result) => {
      res.json({
        message: result.length + " Caterers Found",
        caterer: result,
      });
    })
    .catch((err) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        errors: err,
      });
    });
};

// Update Caterer

exports.update_caterer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      message: "Server side validation failed",
      errors: errors.array(),
    });
  }
  await Caterer.findByIdAndUpdate(
    req.body.userId,
    { $set: req.body },
    (err, caterer) => {
      if (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: "Something went wrong",
          errors: err,
        });
      } else {
        res.json({
          message: "Caterer Updated Successfully",
          caterer: caterer,
        });
      }
    }
  );
};

// Delete Caterer

exports.delete_caterer = async (req, res) => {
  await Caterer.findByIdAndDelete(req.body.userId)
    .then((result) => {
      if (result) {
        res.json({
          message: "Caterer Deleted Successfully",
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Caterer Not Found",
        });
      }
    })
    .catch((err) => {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong",
        errors: err,
      });
    });
};
