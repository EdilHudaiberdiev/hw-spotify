import express from 'express';
import User from '../models/User';
import mongoose from 'mongoose';

const usersRouter = express.Router();

usersRouter.post('/', async (req, res, next) => {
    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });

        await user.generateToken();
        await user.save();
        return res.send(user);
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).send(error);
        }

        next(error);
    }
});
usersRouter.post('/sessions', async (req, res, next) => {

    try {

        const user = await User.findOne({username: req.body.username});

        if (!user) {
            return res
                .status(400)
                .send({error: 'User not found!'});
        }
        const isMatch = await user.checkPassword(req.body.password)

        if (!isMatch) {
            return res
                .status(400)
                .send({error: 'Wrong password!'});
        }

        user.generateToken();
        await user.save();
        return res.send({message: 'Username and password are correct!', user});
    } catch (e) {
        next(e);
    }
});

usersRouter.get('/secret', async (req, res, next) => {
    try {
        const headerValue = req.get('Authorization');

        if (!headerValue) {
            return res.status(401).send({ error: 'No Authorization header present' });
        }

        const [_bearer, token] = headerValue.split(' ');

        if (!token) {
            return res.status(401).send({ error: 'No token present' });
        }

        const user = await User.findOne({ token });

        if (!user) {
            return res.status(401).send({ message: 'Wrong token' });
        }

        return res.send({
            message: 'This is a secret message',
            username: user.username,
        });
    } catch (e) {
        next(e);
    }
});


export default usersRouter