const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route Post /api/posts
// @desc create a  post
// @access Private

router.post(
  '/',
  auth,
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

// @route GET /api/posts
// @desc Get all posts
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route GET /api/posts/:id
// @desc Get post by ID
// @access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('server error');
  }
});

// @route DELETE /api/posts/:id
// @desc Delete post by ID
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    // check user owns the post
    if (post.user.toString() != req.user.id) {
      console.log(post.user.toString(), req.user.id);
      return res.status(401).json({ msg: 'user not authorized' });
    }

    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('server error');
  }
});

// @route PUT /api/posts/like/:id
// @desc like a post
// @access Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() == req.user.id).length ==
      1
    ) {
      return res.status(400).json({ msg: 'Post alreay liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route PUT /api/posts/unlike/:id
// @desc unlike a post
// @access Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter((like) => like.user.toString() == req.user.id).length ==
      0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }
    post.likes = post.likes.filter(
      (like) => like.user.toString() != req.user.id
    );
    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route Post /api/posts/comment/:id
// @desc Comment on a  post
// @access Private

router.post(
  '/comment/:id',
  auth,
  check('text', 'Text is required').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

// @route Delete /api/posts/comment/:id/:comment_id
// @desc delete a Comment from  post
// @access Private

router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    // const user = await User.findById(req.user.id);
    const post = await Post.findById(req.params.id);
    const comments = post.comments.filter((comment) => {
      return comment.id == req.params.comment_id;
    });

    if (comments.length == 0) {
      return res.status(404).json({ msg: 'comment does not exist' });
    }
    if (comments[0].user.toString() != req.user.id) {
      return res.status(401).json({ msg: 'user not authorized' });
    }
    post.comments = post.comments.filter(
      (comment) => comment.id != req.params.comment_id
    );
    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

module.exports = router;
