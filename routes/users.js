    const express = require("express");
    const { auth } = require("../utils/index.js");
    const router = express.Router();
    const { check, validationResult } = require("express-validator");
    const User = require("../models/User.js");
    const bcrypt = require("bcryptjs");
    const jwt = require("jsonwebtoken");
    const config = require("config");

    /*
    Get the request body
    Validate the request body
    Check if user exists, if yes, return error
    Encrypt password
    Save data in DB
    Using JWT create token contains user id, return token.
    */

    /*
    Path: POST /api/users/register
    Desc: Registers a new user
    Public
    */
    router.post(
    "/register",
    check("name", "Name is required").notEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
        "password",
        "Please choose a password with at least 6 characters"
    ).isLength({ min: 6 }),
    async (req, res) => {
        // لو في خطاء حدث عن عمل check هيتخزن في errors object
        const errors = validationResult(req);
        if (!errors.isEmpty()) { //لو مش فاضي يعني معناها لو في errors هيعمل كذا
        //ال errors الاولي هي اي اسم انت ممكن تختاره عادي  اما التانيه هي الي موجوده في ال if condition
        return res.status(400).json({ errors: errors.array() });
        }
        // هنا انا جبت ال (name,..,...) من ال req.body الي بعتهولي ال client
        const { name, email, password } = req.body;

        try {
            // استخدمت ال await لان ال findOne بترجع promise
        let user = await User.findOne({ email });
        if (user) {
            return res
            .status(400)
            .json({ errors: [{ msg: "User already exists" }] });
        }

        user = new User({
            // الي تحت دول ليهم علاقه بالسطر 39
            name,
            email,
            password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // بعد ما ال line ده بيتنفذ بطريقه صحيحه بيحصل create to id لل user من ال DB
        await user.save();

        const payload = {
            user: {
            id: user.id,
            },
        };

        jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: "5 days" },
            (err, token) => {
            if (err) {
                throw err;
            } else {
                res.json({ token });
            }
            }
        );
        } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
        }
    }
    );

    /*
    Path: POST /api/users/login
    Desc: logins an existing user
    Public
    */
    router.post(
    "/login",
    check("email", "Please include a valid email").isEmail(),
    check(
        "password",
        "Please choose a password with at least 6 characters"
    ).isLength({ min: 6 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }
        // ده الي انا متوقع ان ال client هيبعتهم عشان يعمل login
        const { email, password } = req.body;

        try {
        let user = await User.findOne({ email });
        if (!user) {
            return res
            .status(400)
            .json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res
            .status(400)
            .json({ errors: [{ msg: "Invalid Credentials" }] });
        }

        const payload = {
            user: {
            id: user.id,
            },
        };

        jwt.sign(
            payload,
            config.get("jwtSecret"),
            { expiresIn: "5 days" },
            (err, token) => {
            if (err) {
                throw err;
            } else {
                res.json({ token });
            }
            }
        );
        } catch (err) {
        console.error(err.message);
        res.status(500).send(err.message);
        }
    }
    );

    /*
    Path: GET /api/users
    Desc: Takes a token and returns user information
    Private
    */
    router.get("/", auth ,async (req, res) => {
        try {
            // .select("-password");  دي معناها اني بستثني ال password من ال request الي هييجي من ال User.findById(req.user.id)
            // في السطر ده انا عملت create to object its name is user وبعدين هنادي علي ال DB نجيب منها معلومات عن اليزر ماعدا ال password
            const user = await User.findById(req.user.id).select("-password");
            res.json(user);
        } catch (err) {
            console.error(err.message);
            res.status(500).send(err.message);
        }
    })

    module.exports = router;