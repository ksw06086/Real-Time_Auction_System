const { Op } = require('sequelize');
const { Good } = require('../models');

exports.renderMain = async (req, res, next) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); // 어제 시간
    // SoldId IS NULL AND createdAt >= '2023-08-08' => 어제 이후 낙찰자가 없는 상품(현재 진행 중 경매)
    const goods = await Good.findAll({ 
      where: { SoldId: null, createdAt: { [Op.gte]: yesterday } },
    });
    res.render('main', {
      title: 'NodeAuction',
      goods,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.renderJoin = (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeAuction',
  });
};

exports.renderGood = (req, res) => {
  res.render('good', { title: '상품 등록 - NodeAuction' });
};

exports.createGood = async (req, res, next) => {
  try {
    const { name, price } = req.body;
    await Good.create({
      OwnerId: req.user.id,
      name,
      img: req.file.filename,
      price,
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
};