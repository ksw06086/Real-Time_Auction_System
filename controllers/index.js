const { Op } = require('sequelize');
const { Good, Auction, User } = require('../models');

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

exports.renderAuction = async (req, res, next) => {
  try {
    // 동시에 날려도 되면 Promise.all로 묶어도 됨
    // await을 많이 쓴다고 해서 좋은게 아님
    const [ good, auction ] = await Promise.all([
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: `Owner`,
        }
      }),
      Auction.findAll({
        where: { GoodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']]
      }),
    ]);
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
    })
  } catch (error) {
    console.error(error);
    next(error);
  }
}

exports.bid = async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: { id: req.params.id },
      include: { model: Auction },
      // include 된 애를 가지고 정렬할 때
      order: [[{ model: Auction }, 'bid', 'DESC']],
    });
    if(!good){
      return res.status(404).send('해당 상품은 존재하지 않습니다.');
    }
    if(good.price >= bid) {
      return res.status(403).send('시작 가격보다 높게 입찰해야 합니다.');
    }
    if(new Date(good.createdAt).valueOf() + (24*60*60*1000) < new Date()) {
      return res.status(403).send('경매가 이미 종료되었습니다.');
    }
    if(good.Auctions[0]?.bid >= bid) {
      return res.status(403).send('이전 입찰가보다 높아야 합니다.');
    }
    const result = await Auction.create({
      bid,
      msg,
      UserId: req.user.id,
      GoodId: req.params.id,
    });
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
}