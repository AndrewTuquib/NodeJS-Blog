const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



const adminLayout = '../views/layouts/admin';
const loginLayout = '../views/layouts/login';
const jwtSecret = process.env.JWT_SECRET;



// Check Login

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({message : 'Unauthorized'})
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next()
    } catch(error) {
        res.status(401).json({message: 'Unauthorized'})
    }
}


// Get - Admin - Login Page
router.get('/admin', async (req, res) => {
    try {
        
        const locals = {
            title: 'Admin',
            description: 'A simple Blog created with NodeJS, Express and MongoDB.'
        }

        res.render('admin/index', {locals, layout: loginLayout, currentRoute: "/admin", message: ""});
    } catch (error) {
        console.log(error)
    }
})

// Get - Admin - register Page
router.get('/Register', async (req, res) => {
    try {
        
        const locals = {
            title: 'Register',
            description: 'A simple Blog created with NodeJS, Express and MongoDB.'
        }

        res.render('admin/register', {locals, layout: loginLayout, currentRoute: "/register", message:"" });
    } catch (error) {
        console.log(error)
    }
})




// Post - Admin - Check Login
router.post('/admin', async (req, res) => {
    try {

        const {username, password} = req.body;

        const user = await User.findOne( { username } );

        const locals = {
            title: 'Register',
            description: 'A simple Blog created with NodeJS, Express and MongoDB.'
        }

        if (!user) {
            res.render('admin/index', {locals, layout: loginLayout, currentRoute: "/admin", message: 'Invalid credentials.'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.render('admin/index', {locals, layout: loginLayout, currentRoute: "/admin", message: 'Invalid credentials.'});
        }

        const token = jwt.sign({userId: user._id}, jwtSecret)
        res.cookie('token', token, {httpOnly: true});

        res.redirect('/dashboard');

    } catch (error) {
        console.log(error)
    }
})

// Get - Admin Dashboard

router.get('/dashboard', authMiddleware, async(req, res) => {

    try {
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJS, Express & MongoDb'
        }

        const data = await Post.find();

        res.render('admin/dashboard', {
            locals,
            data,
            layout: adminLayout,
            currentRoute: "/dashboard",
        })
    } catch (error) {
        console.log(error)
    }

});

// Get - Admin Create New Post

router.get('/add-post', authMiddleware, async(req, res) => {

    try {
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJS, Express & MongoDb'
        }

        const data = await Post.find();
        res.render('admin/add-post', {
            locals,
            layout: adminLayout,
            data,
            currentRoute: "/add-post",
        })
    } catch (error) {
        console.log(error)
    }
});

// Post - Admin Create New Post

router.post('/add-post', authMiddleware, async(req, res) => {

    try {
        const newPost = new Post({
            title: req.body.title,
            body: req.body.body
        })

        await Post.create(newPost)
        res.redirect('/dashboard')
    } catch (error) {
        console.log(error)
    }
});


// PUT - Admin Edit Post

router.put('/edit-post/:id', authMiddleware, async(req, res) => {

    try {
        
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });

        res.redirect(`/edit-post/${req.params.id}`)

       
    } catch (error) {
        console.log(error)
    }
});

// Delete - Admin Delete Post

router.delete('/delete-post/:id', authMiddleware, async(req, res) => {

    try {
        
        await Post.deleteOne({_id: req.params.id});
        res.redirect(`/dashboard`)

    } catch (error) {
        console.log(error)
    }
});

// Get - Admin Edit Post

router.get('/edit-post/:id', authMiddleware, async(req, res) => {

    try {

        const locals = {
            title: 'Edit Post',
            description: 'Simple Blog created with NodeJS, Express & MongoDb'
        }
        
        const data = await Post.findOne({_id: req.params.id});


        res.render('admin/edit-post', {
            data,
            layout: adminLayout,
            locals,
            currentRoute: "/edit-post",
        });

       
    } catch (error) {
        console.log(error)
    }
});




// Post - Admin - Register
router.post('/register', async (req, res) => {
    try {
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({username, password:hashedPassword})
            res.status(201).render('admin/index', {layout: loginLayout, currentRoute: "/admin", message: 'User successfuly created.'});
        } catch (error) {
            if(error.code === 11000) {
                res.status(409).render('admin/register', {layout: loginLayout, currentRoute: "/admin", message: 'User already in use.'});
            }
            res.status(500).render('admin/register', {layout: loginLayout, currentRoute: "/admin", message: 'Internal server error.'});
        }


    } catch (error) {
        console.log(error);
    }
})

// Get - Admin - Logout
router.get('/logout', async (req, res) => {
    res.clearCookie('token');
    res.redirect('/')
})

//Get - Home Admin
router.get('/adminHome', async (req, res) => {
    
    try {
        const locals = {
            title: 'Node-Js Blog',
            description: 'A simple Blog created with NodeJs, Express, and MongoDB'
        }

        let perPage = 5;
        let page = req.query.page || 1;

        const data = await Post.aggregate([{ $sort: {createdAt: -1}}])
        .skip(perPage * page - perPage)
        .limit(perPage)

        const count = await Post.countDocuments();
        const urlExt = '/adminHome/?page='
        const nextPage = parseInt(page) +1;
        const prevPage = parseInt(page) -1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        const hasPrevPage = nextPage > Math.ceil(count / perPage);



        res.render('index', {
            locals, 
            data,
            current: page,
            nextPage: hasNextPage? nextPage : null,
            prevPage: hasPrevPage? prevPage : null,
            currentRoute: "/adminHome",
            layout: adminLayout,
            urlExt:urlExt
        });
    } catch(error) {
        console.log(error)
    }

});


module.exports = router;