    // ال file ده في functions مساعدين ممكن استخدمهم في اكتر من مكان 
    
    const jwt = require("jsonwebtoken");
    const config = require("config");
    const multer = require("multer");


    /*
    auth هو middleware يتم تمريره كمعامل للمسار. هذا الميدلوير يتحقق مما إذا كان المستخدم مسجل دخوله وصحيحًا (authenticated).
إذا لم يكن المستخدم مصرحًا له، فسيتم منع الوصول إلى هذا المسار  
    
    */
    const auth = (req, res, next) => {
    // Get the token from the request header
    console.log("in auth before token")
    const token = req.header("x-auth-token");
    console.log("token:"+token)

    if (!token) {
        return res
        .status(401)
        .json({ msg: "Token is not available, authorization denied." });
    }

    try {
        jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
        if (error) {
            return res
            .status(401)
            .json({ msg: "Token is not valid, authorization denied." });
        } else {
            console.log("inside else: ")
            console.log("DECODED "+ JSON.stringify(decoded.user))
            req.user = decoded.user;
            next();
        }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message });
    }
    };

    //diskStorage بتاخد input parameter عباره عن object وبداخله two keys
    const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/images");   //كل ال images الي هييجو من ال clients هيتخذنو في هذا الفولدر
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}`)
    }
    });
    
    //multer بتاخد input parameter عباره عن object 
    const upload = multer({storage: storage}).single("file");

    //كده انا اعرف استخدم ال two functions دول خارج ال file ده 
    module.exports = { auth, upload };
