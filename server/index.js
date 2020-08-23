import express from 'express';
import passport from 'passport';
import oauth from './oauth';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config()

const app = express();

console.log(process.env.SESSION_SECRET)

app.use(session({
    secret:process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth',oauth);


app.get('/hello',(req,res)=>{
    res.send('hello')
})

module.exports = {
    path:'/api',
    handler:app
}