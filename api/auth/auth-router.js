const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET, BCRYPT_ROUNDS } = require("../secrets"); // use this secret!
const bcrypt = require("bcryptjs");
const User = require('../users/users-model')
const makeToken = require('./auth-token-builde')

router.post("/register", validateRoleName, async (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user_id": 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
  try{
    const {username, password} = req.body
    const {role_name} = req
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
    const user = await User.add({username, password: hash, role_name})
    res.status(201).json(user)
  }catch(err){
    next(err)
  }
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
    try{
      const validPassword = bcrypt.compareSync(req.body.password, req.user.password)
      if(validPassword){
        const token = makeToken(req.user)
        return  res.status(201).json({ message: `${req.user.username} is back!`, token, subject: req.user.user_id})
      }else{
        next({ status: 401, message: "Invalid credentials"})
      }
    }catch(err){
      next(err)
    }
});

module.exports = router;
