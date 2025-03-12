    const express = require("express");
    const { auth, upload } = require("../utils/index.js");
    const router = express.Router();
    const { check, validationResult } = require("express-validator");
    const normalizeUrl = require("normalize-url");
    const Profile = require("../models/Profile.js");
    const User = require("../models/User.js");
    const Post = require("../models/Post.js");

//router هو كائن في Express.js يُستخدم لتنظيم المسارات وتحديد التعامل معها
//يمكن استخدام router لإنشاء وحدة مسارات فرعية (sub-router) يتم تركيبها داخل المسار الرئيسي 

    /*
    1.  POST /profiles    من خلاله هنعمل create or update to profile
    2.  GET /profiles/me
    3.  GET /profiles -> بيرجع كل ال profiles لكل ال users
    4.  GET /profiles/user/:user_id  -> return spacific profile to spacial user
    5.  DELETE /profiles  -> delete to user and his profile and each posts he created it 
    6.  POST /profiles/upload ->to upload profile image on server  (هنستقبل الصوره من اليوزر وهنحفظها في ال server side)
    7.  PUT /profiles/experience ->to add new experience to exicting profile
    8.  DELETE /profiles/experience/:exp_id
    9.  PUT /profiles/education ->to add new education to exicting profile
    10. DELETE /profiles/education/:edu_id
    */



    /*
    هذا الكود يتعامل مع تحديث أو إنشاء
    ملف شخصي لمستخدم في قاعدة بيانات. يقوم بتفكيك الحقول من req.body، يعالج بعض البيانات 
    مثل skills وروابط التواصل الاجتماعي، ثم يحفظها في قاعدة البيانات، مع
    التأكد من معالجة الأخطاء وإرسال الردود المناسبة للعميل.
    */

    /*ليه انا ضفت ال auth هنا 
    لاني مش عايز اي حد nonauth انه يعمل call لل api ده
    فانا لما بحط ال madilware الي هو auth ده كده انا بتحقق ان الي عمل call لل api 
    هو user authenticated وكمان بعتلي ال token من ضمن ال api request
    */
    router.post(
    "/",
    auth,
    check("status", "Status is required").notEmpty(),
    check("skills", "Skills is required").notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }


// ده ال object الي انا متوقع انه هيجيلي من ال client side
        /*
        {
    "company": “ARAMEX”,
    “status”: “Junior Developer”,
    “skills”: [”HTML, CSS, PHP, JAVASCRIPT”],
    “website”: ”https://www.mywebsite.com“,
    “location”:”Dubai”,
    “bio”:”I am a software engineer and studied in the Arabic university”,
    “github”:””,
    “twitter”:””,
    “youtube”:””
    }
        */
    // ازاي استقبل ال object ده عشان اعمله handaling وبعدين اعمله save in DB

    // (1) هنعدل علي بعض الداتا ونحطهم في  new profile object  
        const {
        website,
        skills,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        github,
        ...rest
        } = req.body;

        const test = Array.isArray(skills)
        ? skills
        : skills.split(",").map((skill) => skill.trim());
        console.log("TEST", test);
        //إنشاء كائن الملف الشخصي (profile object):
        const profile = {
        user: req.user.id,
        website:
            website && website !== ""
            ? normalizeUrl(website, { forceHttps: true })
            : "",
        skills: Array.isArray(skills)
            ? skills
            : skills.split(",").map((skill) => skill.trim()),
        ...rest,
        };

        const socialFields = {
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
        github,
        };
        for (let key in socialFields) {
        const value = socialFields[key];
        if (value && value != "") {
            socialFields[key] = normalizeUrl(value, { forceHttps: true });
        }
        }
       // كده انا ضفت key اسمه social لل profile object واديته value "socialFields"
        profile.social = socialFields;

        // هنا احنا بنخاطب ال DB
        // (2) نتخاطب مع ال DB عشان نضيف ال profile الجديد واذا كان موجود نعدل عليه
        try {
            // findOneAndUpdate ->بتساعدني اني اضيف profile جديد اذا كان مش موجود واذا كان ال profile موجود بتعدل عليه
        let profileObject = await Profile.findOneAndUpdate(
            // دي عباره عن arguments
            // req.user.id  -> بجبها من ال token
            { user: req.user.id },   //معناها اني بدي اعمل Create لل profile هذا لاي user او update لاي user
            { $set: profile },  //ده ال object الي انا عاوز اضيفه او اعدله في ال DB
            { new: true, upsert: true }   // إذا وُجد الملف، يتم تحديثه؛ وإذا لم يوجد، يتم إنشاء ملف جديد
        );
        return res.json(profileObject);
        } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
        }
    }
    );

    router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
        user: req.user.id,   // عشان اجيب ال profile ل user معين 
        // ولكن ال Profile Model لا يحتوي علي اسم اليزر عشان كده هستخدم function populate
        /*
        populate بتاخد اول حاجه اسم ال collection الي انا عاوز اجيب منه الداتا الي بدي اضفها علي ال object هذا 
        وبقولو بقي هاتلي ال atrebute الي اسمه name في ال user collection 
        */
        }).populate("user", ["name"]);

        // لو اصلا اليزر معندوش profile
        if (!profile) {
        return res.status(400).json({ msg: "There is no profile for this user" });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    // بيرجع كل ال profiles لكل ال users
    router.get("/", auth, async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", ["name"]);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    router.get("/user/:user_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
        user: req.params.user_id,    //هجيب ال user id من ال request 
        }).populate("user", ["name"]);

        if (!profile) {
        return res
            .status(400)
            .json({ msg: "There is no profile for the given user" });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    router.delete("/", auth, async (req, res) => {
    // Remove (1)posts, (2)profile, (3)user
        //ال Api ده هيعمل delete من خلال ال id الي مبعتلو من ال token 
    try {
        await Promise.all([
        Post.deleteMany({user: req.user.id}),   //بعمل delete لكل ال posts الي ليهم علاقه ب user معين
        Profile.findOneAndRemove({ user: req.user.id }),   // user: req.user.id -> ده عباره عن filter معناها انه هيعمل remove حسب ال userid الي هيتبعت
        User.findOneAndRemove({ _id: req.user.id }),  //بعمل delete لل user
        ]);

        res.json({ msg: "User information is deleted successfully" });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    router.post("/upload", auth, async (req, res) => {
    try {
        console.log("inside upload")
        upload(req, res, async (err) => {
        if (err) {
            console.log("Error:"+ err)
            res.status(500).send(`Server Error: ${err}`);
        } else {
            try {
                // مستخدمنهاش ال json واستخدمنا send لان احنا بنرجع one value
            res.status(200).send(req.user.id);
            } catch (err) {
            console.log(err);
            }
        }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send(`Server Error: ${err}`);
    }
    });

    // create to experience 
    router.put(
    "/experience",
    auth,
    check("title", "Title is required").notEmpty(),
    check("company", "Company is required").notEmpty(),
    check("from", "From date is required and needs to be from the past")
        .notEmpty()
        .custom((value, { req }) => {
        // condition ? expressionIfTrue : expressionIfFalse
        return req.body.to ? value < req.body.to : true;
        }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        //لو مفيش errors هروح بقي اكلم ال DB عشان اضيف experience
        try {
            // كده انا روحت جبت ال profile عشان اطيف ال experience عليه
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(req.body); // unshift ->تستخدم لاضافه اي عنصر هيدخلها في اول  ال array الي هي  " experience"
        await profile.save();
        return res.json(profile);
        } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
        }
    }
    );

    router.delete("/experience/:exp_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
                        // = experience array بعد التعديل 
        profile.experience = profile.experience.filter(exp => {  //ال filter func شبيها بال for loop وال exp patameter ده الي هو بيعدي علي كل عنصر في ال array 
        // toString ->عشان اتأكد انه string
            return exp._id.toString() !== req.params.exp_id;         //هحط شرط معين ومن خلال الشرط ده ال function filter هتعملي remove to any experince i need to delete it
        });
        
        await profile.save();
        return res.json(profile);

    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    router.put(
    "/education",
    auth,
    check("school", "School is required").notEmpty(),
    check("degree", "Degree is required").notEmpty(),
    check("fieldofstudy", "Field of study is required").notEmpty(),
    check("from", "From date is required and needs to be from the past")
        .notEmpty()
        .custom((value, { req }) => {
        return req.body.to ? value < req.body.to : true;
        }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(req.body);
        await profile.save();
        return res.json(profile);
        } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
        }
    }
    );

    router.delete("/education/:edu_id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education = profile.education.filter(edu => {
        return edu._id.toString() !== req.params.edu_id;
        });
        
        await profile.save();
        return res.json(profile);

    } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
    }
    });

    module.exports = router;
