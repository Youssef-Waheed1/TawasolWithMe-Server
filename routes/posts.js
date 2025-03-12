    const express = require("express");
    const router = express.Router();
    const { auth } = require("../utils");
    const { check, validationResult } = require("express-validator");
    const User = require("../models/User");
    const Post = require("../models/Post");

    /*
    1. POST /posts    ->create new post 
    2. GET /posts  ->get all posts in the server
    3. GET /posts/:id
    4. DELETE /posts/:id
    5. PUT /posts/like/:id
    6. PUT /posts/unlike/:id
    7. POST /posts/comment/:id
    8. DELETE /posts/comment/:id/:comment_id
    */

    router.post(
    "/",
    auth,
    check("text", "Text is required").notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);    // to get errors if exist 
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }
        // لو مفيش errors هتكلم بقي مع ال database 
        try {          //وكل معلومات ال user راح تتحفظ في ال user object ما عدا ال password 
                                //عباره عن function بديها ال id بتاع ال user وبترجع ال user object
        const user = await User.findById(req.user.id).select("-password");      //to get user object , select("-password") انا مش عاوز ارحع ال password لل client 
        
        const newPost = new Post({          // هنا انا بعمل create ل object جديد من ال model Post
            text: req.body.text,
            name: user.name,
            user: req.user.id,   // لما تيجي تعمل call to this api في _id object هيكون تبع ال post وليس ال user وده بيتعمله create من DB تلقائي
        });
                    //  save() بتعمل save لل newPost في ال Collection الي اسمه Post
        const post = await newPost.save();    //بعد الحفظ في قاعده البيانات، يتم إرجاع الكائن المحفوظ، والذي يحتوي على كل البيانات المحفوظة بما في ذلك المعرف الذي تم إنشاؤه حديثًا (إن وجد).
        res.json(post);
        } catch (err) {
        console.error(err.message);
        return res.status(500).send(err.message);
        }
    }
    );

    router.get("/", auth, async (req, res) => {
    try {     //find() ->هتجيب كل معلومات ال posts الموجوده في ال post collection
        const posts = await Post.find().sort({ date: -1 });    // هرتب ال posts تنازليا من الجديد الي القديم حسب ال date بتاع المنشور يعني ده الي هيرتب من خلاله تنازليا
        res.json(posts);   //عشان نرجع ال posts لل client
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
    }
    });

    router.get("/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {    //extra validation لان ال client ممكن يبعتلي id مش صحيح 
        return res.status(404).json({ msg: "Post not found" });
        }

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
    }
    });


    /*
    لما تعمل call to this api هيبعتلك 
    [
    {
        "user": "66c37197d7b1ad01839561b5",      id بتاع اليوزر الي عمل like
        "_id": "66c3b05eccd37835c50da243"        id ده الي mongodb عملو create
    }
]
    */

    router.put("/like/:id", auth, async (req, res) => {
    try {
        // id = means the post_id 
        // req.params.id    ==  /like/:id  
        const post = await Post.findById(req.params.id);         // fetch لل post الي انا عاوز اعدل عليه

        //some عباره عن function وكمان بتاخد callback function
        if (post.likes.some((like) => like.user.toString() === req.user.id)) {    //هعمل تحقق ان اليوزر معملش ليك قبل كده علي نفس ال post
        return res.status(400).json({ msg: "Post already liked" });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        return res.json(post.likes);   //return all array of likes
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
    }
    });

    /*
    يتم تعريف مسار لإلغاء الإعجاب بمنشور معين.
    يتم التحقق من أن المستخدم قد أعجب بالمنشور من قبل.
    إذا لم يكن قد أعجب به، يتم إرسال رسالة خطأ.
    إذا كان قد أعجب بالمنشور، يتم إزالة الإعجاب من المصفوفة.
    يتم حفظ التغييرات (فيما بعد الكود المقدم) وإرسال استجابة بنجاح العملية.
    */
    router.put("/unlike/:id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
        return res
            .status(400)
            .json({ msg: "User has not liked the post previously!" });
        }

        // إذا كان قد أعجب بالمنشور، يتم إزالة الإعجاب من المصفوفة.
        //هنا يتم استخدام filter() لإنشاء مصفوفة جديدة تحتوي فقط على الإعجابات التي لا ينتمي فيها user إلى المستخدم الحالي المسخدم الحالي اقصد بيها الي هو عامل call لل api ده 
        /*
        يتم التحقق من كل عنصر في post.likes ومقارنته بمعرف المستخدم (req.user.id).
        إذا لم يتطابق معرف المستخدم مع like.user.toString(), يبقى الإعجاب في المصفوفة.
        يتم إعادة تعيين post.likes إلى هذه المصفوفة المفلترة.
        */
                 //= كده احنا هنعدل علي ال likes array
        post.likes = post.likes.filter(    //مبدائها زي ال map,some بتاخد callback function
        (like) => like.user.toString() !== req.user.id    // like.user.toString() !== req.user.id    <- ده عباره عن condition
        );

        await post.save();

        return res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
    }
    });

    router.post(
    "/comment/:id",
    auth,
    check("text", "Text is required").notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        }

        try {
            // User.findById(req.user.id)  -> ده هجيبه من ال token 
            //Post.findById(req.params.id) -> ده هجيبه من ال id parameter الي هيبعته ال user في ال URL
        const user = await User.findById(req.user.id).select("-password");     // عايز اجيب ال user object 
        const post = await Post.findById(req.params.id);   // عايز اجيب ال post الي هعدل عليه

        const newComment = {     //هعمل create ل comment object جديد وبعدين اضيفه علي ال Array بتاعه ال comment الاصليه
            text: req.body.text,
            name: user.name,            //بسبب المعلومه دي انا  جبت ال user object فوق 
            user: req.user.id,
        };

        post.comments.unshift(newComment);
        await post.save();
        res.json(post.comments);
        } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
        }
    }
    );

    //:id  -> ده بتاع ال post
    router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        const comment = post.comments.find((comment) => {   //باستخدام ال find function هرجع item واحد فقط يطابق ال condation ده " comment.id === req.params.comment_id"
                   // ده الي في ال DB === ده الي بعته اليوزر
            return comment.id === req.params.comment_id;
        });

        if (!comment) {   //ال validation ده عشان لو اليوزر بعتلي comment_id غير صحيح 
        return res.status(404).json({ msg: "Comment does not exist" });
        }

        if (comment.user.toString() !== req.user.id) {      //هنعمل validation تاني عشان نتأكد ان الي عايز يمسح ال commet ده هو اصلا authentication وكمان ال comment ده هو الي كاتبه مش بتاع يوزر تاني
        return res.status(401).json({ msg: "User is not authorized" });
        }

        post.comments = post.comments.filter((comment) => {  //هعمل filter لل comment الي بتطابق ال /comment/:id/:comment_id  الي باعتها اليوزر
        return comment.id !== req.params.comment_id;         // اي comment لا تطابق ال /comment/:id/:comment_id هعملها return في ال post.comments
        });

        await post.save();
        return res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error " + err.message);
    }
    });

    router.delete("/:id", auth, async (req, res) => {        // (DELETE /posts/:id)     هنعمل delete ل post معين حسب ال id
        try {
            // req.params.id  <- ده ال id الي بعته ال client
            const post = await Post.findById(req.params.id);      //عشان اجيب ال post الي عاوز اعمله delete

            if(!post) {
                return res.status(404).json({msg: "Post not found"});
            }

            if(post.user.toString() !== req.user.id) {
                return res.status(401).json({msg: "User is not authorized to remove this post"});
            }

            await post.remove();

            res.json({msg: "Post is removed"});
        } catch(err) {
            console.error(err.message);
            res.status(500).send("Server Error " + err.message);
        }
    })

    module.exports = router;
