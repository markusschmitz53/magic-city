var crewActive,
	crewActionBlock;

	/*
	 * P5 Changes for performance
	 *
	 * https://stackoverflow.com/questions/35917819/garbage-collector-ruins-webgl-page-performance
	 *
		p5.prototype.color = function (c) {
		  if (c.constructor === p5.Color)  return c;
		  const isArrayLike = typeof c === 'object' && c.length >= 0;
		  return new p5.Color(this, isArrayLike? c : arguments);
		};
	 *
	 */
	class magicCity {

		/**
		 * The magic city contains our whole world.
		 *
		 * https://color.adobe.com/Dark-Winter-color-theme-10359770/
		 */
		constructor () {
			this.backgroundColor = color('#06080A');

			// Audio
			this.mic = {};
			this.fft = {};
			this.microphoneThreshold = 0.05;

			this.maxX = (width/2);
			this.maxY = (height/2);

			this.moonSize = (windowHeight / 4);
			this.moonTempo = 1;
			this.moonTrajectoryRadius = 0.00009;

			this.moonPosition = createVector(-this.maxX + 100, -200); // initialpos
			this.moonAngle = 0;

			this.shootingStarPropability = 0.4;
			this.shootingStarThreshold = 0.3;
			this.shootingStarFrameCount = 15;
			this.maxStars = 150;
			this.starSize = 3;

			this.earthquakeActive = false;
			this.earthquakeTimeout = 4000;

			this.train = {};
			this.trainBlock = false;
			this.trainDepartureTimeout = 300; // in Frames
			this.trainCancellationLimit = 0.25;

			crewActionBlock = false;
			crewActive = false;

			this.spectrum = [];
			this.textureBackgroundPane = {};

			this.setupExecuted = false;

			return this;
		}

		setup ()
		{
			let pos0 = (-this.maxX),
					color1 = '#030F1D',
					color2 = '#07162A',
					color3 = '#072A40',
					color4 = '#234256';

			/*
					color1 = 'rgba(3,15,29, 1)',
					color2 = 'rgba(7,22,42, 1)',
					color3 = '#072A40',
					color4 = '#233656'; // #204576
					*/


			// https://color.adobe.com/de/Kopia-av-Kopia-av-forest-in-pine-color-theme-11618619/edit/?copy=true
			/*
					color1 = '#131C28',
					color2 = '#39485A',
					color3 = '#324858',
					color4 = '#6E8EA5';
			 */

			pixelDensity(1);

			this.mic = new p5.AudioIn();
			this.mic.amp(1);
			this.mic.start();

			 // optional highpass filter that removes some bass (see output of drawDebug())
			/* let filter = new p5.BandPass();
			 filter.set(12000,1);
			 filter.process(this.mic);*/

			// 1. parameter = smoothing, 2. = number of bins / buffer length
			this.fft = new p5.FFT(0.4, 256);
			this.fft.setInput(this.mic);

			this.train = new Train(createVector(this.maxX, this.maxY));

			this.stars = [];
			this.shootingStars = [];

			let actualStarCount = Math.ceil(random((this.maxStars - (this.maxStars / 4)), this.maxStars));

			for (let i = 0; i < actualStarCount; i++)
			{
				this.stars.push(new Star(this.starSize, this.maxX, this.maxY));
			}

			/**
			 *
			 * @type {Building[]}
			 */
			/*
			this.buildings = [
				new TvTower(pos0 + (width / 5) + (width / 10) + (width / 9), color1), // dark gray
				new ParkInn(pos0 + (width / 3) + (width / 5), 10, 7, color1), // dark gray
				new Building(pos0 + (width / 3) + (width / 7), 9, 6, color2), // dark blue, 7. building
				new Building(pos0 + (width / 2) + 140, 11, 5, color4), // light gray building
				new Building(pos0 + (width / 3) + (width / 8), 7, 5, color3),  // light blue

				new Building(pos0 + (width / 4), 8, 9, color1),  // dark blue || 2. building
				new Building(pos0 + (width / 5), 6, 7, color3), // 1. building
				new Building(pos0 + (width / 5) + (width / 10), 7, 8, color2), // 3. building
				new Charite(pos0 + (width / 6) + (width / 10), 17, 3, color4)
			];*/
			this.buildings = [
				new TvTower(pos0 + (width / 5) + (width / 10) + (width / 8), color1), // dark gray
				new ParkInn(pos0 + (width / 3) + (width / 4), 10, 7, color1), // dark gray
				new Building(pos0 + (width / 3) + (width / 6), 9, 6, color2), // dark blue, 7. building
				new Building(pos0 + (width / 2) + (width / 6), 11, 5, color4), // light gray building
				new Building(pos0 + (width / 3) + (width / 8), 7, 5, color3),  // light blue

				new Building(pos0  + (width / 7) + (width / 10), 8, 7, color1),  // dark blue || 2. building
				new Building(pos0 + (width / 5) + (width / 10), 7, 6, color2), // 3. building
				new Building(pos0 + (width / 5), 6, 5, color3), // 1. building
				new Charite(pos0 + (width / 6) + (width / 10), 17, 3, color4)
			];

			if (width > 1550)
			{
				// dark gray || last building
			//	this.buildings.push(new Building(pos0 + 1468, 6, 7, color1));
				// dark blue
			//	this.buildings.push(new Building(pos0 + 1363, 9, 6, color2));
			}

			this.textureBackgroundPane = createBackgroundGradient(width, height, color('#39485A'), this.backgroundColor);

			// https://stackoverflow.com/a/21457293/1102709
			console.info("%cmagic city by sero %s", "text-shadow: -1px -1px hsl(0,100%,50%), 1px 1px hsl(5.4, 100%, 50%), 3px 2px hsl(10.8, 100%, 50%), 5px 3px hsl(16.2, 100%, 50%), 7px 4px hsl(21.6, 100%, 50%), 9px 5px hsl(27, 100%, 50%), 11px 6px hsl(32.4, 100%, 50%), 13px 7px hsl(37.8, 100%, 50%), 14px 8px hsl(43.2, 100%, 50%), 16px 9px hsl(48.6, 100%, 50%), 18px 10px hsl(54, 100%, 50%), 20px 11px hsl(59.4, 100%, 50%), 22px 12px hsl(64.8, 100%, 50%), 23px 13px hsl(70.2, 100%, 50%), 25px 14px hsl(75.6, 100%, 50%), 27px 15px hsl(81, 100%, 50%), 28px 16px hsl(86.4, 100%, 50%), 30px 17px hsl(91.8, 100%, 50%), 32px 18px hsl(97.2, 100%, 50%), 33px 19px hsl(102.6, 100%, 50%), 35px 20px hsl(108, 100%, 50%), 36px 21px hsl(113.4, 100%, 50%), 38px 22px hsl(118.8, 100%, 50%), 39px 23px hsl(124.2, 100%, 50%), 41px 24px hsl(129.6, 100%, 50%), 42px 25px hsl(135, 100%, 50%), 43px 26px hsl(140.4, 100%, 50%), 45px 27px hsl(145.8, 100%, 50%), 46px 28px hsl(151.2, 100%, 50%), 47px 29px hsl(156.6, 100%, 50%), 48px 30px hsl(162, 100%, 50%), 49px 31px hsl(167.4, 100%, 50%), 50px 32px hsl(172.8, 100%, 50%), 51px 33px hsl(178.2, 100%, 50%), 52px 34px hsl(183.6, 100%, 50%), 53px 35px hsl(189, 100%, 50%), 54px 36px hsl(194.4, 100%, 50%), 55px 37px hsl(199.8, 100%, 50%), 55px 38px hsl(205.2, 100%, 50%), 56px 39px hsl(210.6, 100%, 50%), 57px 40px hsl(216, 100%, 50%), 57px 41px hsl(221.4, 100%, 50%), 58px 42px hsl(226.8, 100%, 50%), 58px 43px hsl(232.2, 100%, 50%), 58px 44px hsl(237.6, 100%, 50%), 59px 45px hsl(243, 100%, 50%), 59px 46px hsl(248.4, 100%, 50%), 59px 47px hsl(253.8, 100%, 50%), 59px 48px hsl(259.2, 100%, 50%), 59px 49px hsl(264.6, 100%, 50%), 60px 50px hsl(270, 100%, 50%), 59px 51px hsl(275.4, 100%, 50%), 59px 52px hsl(280.8, 100%, 50%), 59px 53px hsl(286.2, 100%, 50%), 59px 54px hsl(291.6, 100%, 50%), 59px 55px hsl(297, 100%, 50%), 58px 56px hsl(302.4, 100%, 50%), 58px 57px hsl(307.8, 100%, 50%), 58px 58px hsl(313.2, 100%, 50%), 57px 59px hsl(318.6, 100%, 50%), 57px 60px hsl(324, 100%, 50%), 56px 61px hsl(329.4, 100%, 50%), 55px 62px hsl(334.8, 100%, 50%), 55px 63px hsl(340.2, 100%, 50%), 54px 64px hsl(345.6, 100%, 50%), 53px 65px hsl(351, 100%, 50%), 52px 66px hsl(356.4, 100%, 50%), 51px 67px hsl(361.8, 100%, 50%), 50px 68px hsl(367.2, 100%, 50%), 49px 69px hsl(372.6, 100%, 50%), 48px 70px hsl(378, 100%, 50%), 47px 71px hsl(383.4, 100%, 50%), 46px 72px hsl(388.8, 100%, 50%), 45px 73px hsl(394.2, 100%, 50%), 43px 74px hsl(399.6, 100%, 50%), 42px 75px hsl(405, 100%, 50%), 41px 76px hsl(410.4, 100%, 50%), 39px 77px hsl(415.8, 100%, 50%), 38px 78px hsl(421.2, 100%, 50%), 36px 79px hsl(426.6, 100%, 50%), 35px 80px hsl(432, 100%, 50%), 33px 81px hsl(437.4, 100%, 50%), 32px 82px hsl(442.8, 100%, 50%), 30px 83px hsl(448.2, 100%, 50%), 28px 84px hsl(453.6, 100%, 50%), 27px 85px hsl(459, 100%, 50%), 25px 86px hsl(464.4, 100%, 50%), 23px 87px hsl(469.8, 100%, 50%), 22px 88px hsl(475.2, 100%, 50%), 20px 89px hsl(480.6, 100%, 50%), 18px 90px hsl(486, 100%, 50%), 16px 91px hsl(491.4, 100%, 50%), 14px 92px hsl(496.8, 100%, 50%), 13px 93px hsl(502.2, 100%, 50%), 11px 94px hsl(507.6, 100%, 50%), 9px 95px hsl(513, 100%, 50%), 7px 96px hsl(518.4, 100%, 50%), 5px 97px hsl(523.8, 100%, 50%), 3px 98px hsl(529.2, 100%, 50%), 1px 99px hsl(534.6, 100%, 50%), 7px 100px hsl(540, 100%, 50%), -1px 101px hsl(545.4, 100%, 50%), -3px 102px hsl(550.8, 100%, 50%), -5px 103px hsl(556.2, 100%, 50%), -7px 104px hsl(561.6, 100%, 50%), -9px 105px hsl(567, 100%, 50%), -11px 106px hsl(572.4, 100%, 50%), -13px 107px hsl(577.8, 100%, 50%), -14px 108px hsl(583.2, 100%, 50%), -16px 109px hsl(588.6, 100%, 50%), -18px 110px hsl(594, 100%, 50%), -20px 111px hsl(599.4, 100%, 50%), -22px 112px hsl(604.8, 100%, 50%), -23px 113px hsl(610.2, 100%, 50%), -25px 114px hsl(615.6, 100%, 50%), -27px 115px hsl(621, 100%, 50%), -28px 116px hsl(626.4, 100%, 50%), -30px 117px hsl(631.8, 100%, 50%), -32px 118px hsl(637.2, 100%, 50%), -33px 119px hsl(642.6, 100%, 50%), -35px 120px hsl(648, 100%, 50%), -36px 121px hsl(653.4, 100%, 50%), -38px 122px hsl(658.8, 100%, 50%), -39px 123px hsl(664.2, 100%, 50%), -41px 124px hsl(669.6, 100%, 50%), -42px 125px hsl(675, 100%, 50%), -43px 126px hsl(680.4, 100%, 50%), -45px 127px hsl(685.8, 100%, 50%), -46px 128px hsl(691.2, 100%, 50%), -47px 129px hsl(696.6, 100%, 50%), -48px 130px hsl(702, 100%, 50%), -49px 131px hsl(707.4, 100%, 50%), -50px 132px hsl(712.8, 100%, 50%), -51px 133px hsl(718.2, 100%, 50%), -52px 134px hsl(723.6, 100%, 50%), -53px 135px hsl(729, 100%, 50%), -54px 136px hsl(734.4, 100%, 50%), -55px 137px hsl(739.8, 100%, 50%), -55px 138px hsl(745.2, 100%, 50%), -56px 139px hsl(750.6, 100%, 50%), -57px 140px hsl(756, 100%, 50%), -57px 141px hsl(761.4, 100%, 50%), -58px 142px hsl(766.8, 100%, 50%), -58px 143px hsl(772.2, 100%, 50%), -58px 144px hsl(777.6, 100%, 50%), -59px 145px hsl(783, 100%, 50%), -59px 146px hsl(788.4, 100%, 50%), -59px 147px hsl(793.8, 100%, 50%), -59px 148px hsl(799.2, 100%, 50%), -59px 149px hsl(804.6, 100%, 50%), -60px 150px hsl(810, 100%, 50%), -59px 151px hsl(815.4, 100%, 50%), -59px 152px hsl(820.8, 100%, 50%), -59px 153px hsl(826.2, 100%, 50%), -59px 154px hsl(831.6, 100%, 50%), -59px 155px hsl(837, 100%, 50%), -58px 156px hsl(842.4, 100%, 50%), -58px 157px hsl(847.8, 100%, 50%), -58px 158px hsl(853.2, 100%, 50%), -57px 159px hsl(858.6, 100%, 50%), -57px 160px hsl(864, 100%, 50%), -56px 161px hsl(869.4, 100%, 50%), -55px 162px hsl(874.8, 100%, 50%), -55px 163px hsl(880.2, 100%, 50%), -54px 164px hsl(885.6, 100%, 50%), -53px 165px hsl(891, 100%, 50%), -52px 166px hsl(896.4, 100%, 50%), -51px 167px hsl(901.8, 100%, 50%), -50px 168px hsl(907.2, 100%, 50%), -49px 169px hsl(912.6, 100%, 50%), -48px 170px hsl(918, 100%, 50%), -47px 171px hsl(923.4, 100%, 50%), -46px 172px hsl(928.8, 100%, 50%), -45px 173px hsl(934.2, 100%, 50%), -43px 174px hsl(939.6, 100%, 50%), -42px 175px hsl(945, 100%, 50%), -41px 176px hsl(950.4, 100%, 50%), -39px 177px hsl(955.8, 100%, 50%), -38px 178px hsl(961.2, 100%, 50%), -36px 179px hsl(966.6, 100%, 50%), -35px 180px hsl(972, 100%, 50%), -33px 181px hsl(977.4, 100%, 50%), -32px 182px hsl(982.8, 100%, 50%), -30px 183px hsl(988.2, 100%, 50%), -28px 184px hsl(993.6, 100%, 50%), -27px 185px hsl(999, 100%, 50%), -25px 186px hsl(1004.4, 100%, 50%), -23px 187px hsl(1009.8, 100%, 50%), -22px 188px hsl(1015.2, 100%, 50%), -20px 189px hsl(1020.6, 100%, 50%), -18px 190px hsl(1026, 100%, 50%), -16px 191px hsl(1031.4, 100%, 50%), -14px 192px hsl(1036.8, 100%, 50%), -13px 193px hsl(1042.2, 100%, 50%), -11px 194px hsl(1047.6, 100%, 50%), -9px 195px hsl(1053, 100%, 50%), -7px 196px hsl(1058.4, 100%, 50%), -5px 197px hsl(1063.8, 100%, 50%), -3px 198px hsl(1069.2, 100%, 50%), -1px 199px hsl(1074.6, 100%, 50%), -1px 200px hsl(1080, 100%, 50%), 1px 201px hsl(1085.4, 100%, 50%), 3px 202px hsl(1090.8, 100%, 50%), 5px 203px hsl(1096.2, 100%, 50%), 7px 204px hsl(1101.6, 100%, 50%), 9px 205px hsl(1107, 100%, 50%), 11px 206px hsl(1112.4, 100%, 50%), 13px 207px hsl(1117.8, 100%, 50%), 14px 208px hsl(1123.2, 100%, 50%), 16px 209px hsl(1128.6, 100%, 50%), 18px 210px hsl(1134, 100%, 50%), 20px 211px hsl(1139.4, 100%, 50%), 22px 212px hsl(1144.8, 100%, 50%), 23px 213px hsl(1150.2, 100%, 50%), 25px 214px hsl(1155.6, 100%, 50%), 27px 215px hsl(1161, 100%, 50%), 28px 216px hsl(1166.4, 100%, 50%), 30px 217px hsl(1171.8, 100%, 50%), 32px 218px hsl(1177.2, 100%, 50%), 33px 219px hsl(1182.6, 100%, 50%), 35px 220px hsl(1188, 100%, 50%), 36px 221px hsl(1193.4, 100%, 50%), 38px 222px hsl(1198.8, 100%, 50%), 39px 223px hsl(1204.2, 100%, 50%), 41px 224px hsl(1209.6, 100%, 50%), 42px 225px hsl(1215, 100%, 50%), 43px 226px hsl(1220.4, 100%, 50%), 45px 227px hsl(1225.8, 100%, 50%), 46px 228px hsl(1231.2, 100%, 50%), 47px 229px hsl(1236.6, 100%, 50%), 48px 230px hsl(1242, 100%, 50%), 49px 231px hsl(1247.4, 100%, 50%), 50px 232px hsl(1252.8, 100%, 50%), 51px 233px hsl(1258.2, 100%, 50%), 52px 234px hsl(1263.6, 100%, 50%), 53px 235px hsl(1269, 100%, 50%), 54px 236px hsl(1274.4, 100%, 50%), 55px 237px hsl(1279.8, 100%, 50%), 55px 238px hsl(1285.2, 100%, 50%), 56px 239px hsl(1290.6, 100%, 50%), 57px 240px hsl(1296, 100%, 50%), 57px 241px hsl(1301.4, 100%, 50%), 58px 242px hsl(1306.8, 100%, 50%), 58px 243px hsl(1312.2, 100%, 50%), 58px 244px hsl(1317.6, 100%, 50%), 59px 245px hsl(1323, 100%, 50%), 59px 246px hsl(1328.4, 100%, 50%), 59px 247px hsl(1333.8, 100%, 50%), 59px 248px hsl(1339.2, 100%, 50%), 59px 249px hsl(1344.6, 100%, 50%), 60px 250px hsl(1350, 100%, 50%), 59px 251px hsl(1355.4, 100%, 50%), 59px 252px hsl(1360.8, 100%, 50%), 59px 253px hsl(1366.2, 100%, 50%), 59px 254px hsl(1371.6, 100%, 50%), 59px 255px hsl(1377, 100%, 50%), 58px 256px hsl(1382.4, 100%, 50%), 58px 257px hsl(1387.8, 100%, 50%), 58px 258px hsl(1393.2, 100%, 50%), 57px 259px hsl(1398.6, 100%, 50%), 57px 260px hsl(1404, 100%, 50%), 56px 261px hsl(1409.4, 100%, 50%), 55px 262px hsl(1414.8, 100%, 50%), 55px 263px hsl(1420.2, 100%, 50%), 54px 264px hsl(1425.6, 100%, 50%), 53px 265px hsl(1431, 100%, 50%), 52px 266px hsl(1436.4, 100%, 50%), 51px 267px hsl(1441.8, 100%, 50%), 50px 268px hsl(1447.2, 100%, 50%), 49px 269px hsl(1452.6, 100%, 50%), 48px 270px hsl(1458, 100%, 50%), 47px 271px hsl(1463.4, 100%, 50%), 46px 272px hsl(1468.8, 100%, 50%), 45px 273px hsl(1474.2, 100%, 50%), 43px 274px hsl(1479.6, 100%, 50%), 42px 275px hsl(1485, 100%, 50%), 41px 276px hsl(1490.4, 100%, 50%), 39px 277px hsl(1495.8, 100%, 50%), 38px 278px hsl(1501.2, 100%, 50%), 36px 279px hsl(1506.6, 100%, 50%), 35px 280px hsl(1512, 100%, 50%), 33px 281px hsl(1517.4, 100%, 50%), 32px 282px hsl(1522.8, 100%, 50%), 30px 283px hsl(1528.2, 100%, 50%), 28px 284px hsl(1533.6, 100%, 50%), 27px 285px hsl(1539, 100%, 50%), 25px 286px hsl(1544.4, 100%, 50%), 23px 287px hsl(1549.8, 100%, 50%), 22px 288px hsl(1555.2, 100%, 50%), 20px 289px hsl(1560.6, 100%, 50%), 18px 290px hsl(1566, 100%, 50%), 16px 291px hsl(1571.4, 100%, 50%), 14px 292px hsl(1576.8, 100%, 50%), 13px 293px hsl(1582.2, 100%, 50%), 11px 294px hsl(1587.6, 100%, 50%), 9px 295px hsl(1593, 100%, 50%), 7px 296px hsl(1598.4, 100%, 50%), 5px 297px hsl(1603.8, 100%, 50%), 3px 298px hsl(1609.2, 100%, 50%), 1px 299px hsl(1614.6, 100%, 50%), 2px 300px hsl(1620, 100%, 50%), -1px 301px hsl(1625.4, 100%, 50%), -3px 302px hsl(1630.8, 100%, 50%), -5px 303px hsl(1636.2, 100%, 50%), -7px 304px hsl(1641.6, 100%, 50%), -9px 305px hsl(1647, 100%, 50%), -11px 306px hsl(1652.4, 100%, 50%), -13px 307px hsl(1657.8, 100%, 50%), -14px 308px hsl(1663.2, 100%, 50%), -16px 309px hsl(1668.6, 100%, 50%), -18px 310px hsl(1674, 100%, 50%), -20px 311px hsl(1679.4, 100%, 50%), -22px 312px hsl(1684.8, 100%, 50%), -23px 313px hsl(1690.2, 100%, 50%), -25px 314px hsl(1695.6, 100%, 50%), -27px 315px hsl(1701, 100%, 50%), -28px 316px hsl(1706.4, 100%, 50%), -30px 317px hsl(1711.8, 100%, 50%), -32px 318px hsl(1717.2, 100%, 50%), -33px 319px hsl(1722.6, 100%, 50%), -35px 320px hsl(1728, 100%, 50%), -36px 321px hsl(1733.4, 100%, 50%), -38px 322px hsl(1738.8, 100%, 50%), -39px 323px hsl(1744.2, 100%, 50%), -41px 324px hsl(1749.6, 100%, 50%), -42px 325px hsl(1755, 100%, 50%), -43px 326px hsl(1760.4, 100%, 50%), -45px 327px hsl(1765.8, 100%, 50%), -46px 328px hsl(1771.2, 100%, 50%), -47px 329px hsl(1776.6, 100%, 50%), -48px 330px hsl(1782, 100%, 50%), -49px 331px hsl(1787.4, 100%, 50%), -50px 332px hsl(1792.8, 100%, 50%), -51px 333px hsl(1798.2, 100%, 50%), -52px 334px hsl(1803.6, 100%, 50%), -53px 335px hsl(1809, 100%, 50%), -54px 336px hsl(1814.4, 100%, 50%), -55px 337px hsl(1819.8, 100%, 50%), -55px 338px hsl(1825.2, 100%, 50%), -56px 339px hsl(1830.6, 100%, 50%), -57px 340px hsl(1836, 100%, 50%), -57px 341px hsl(1841.4, 100%, 50%), -58px 342px hsl(1846.8, 100%, 50%), -58px 343px hsl(1852.2, 100%, 50%), -58px 344px hsl(1857.6, 100%, 50%), -59px 345px hsl(1863, 100%, 50%), -59px 346px hsl(1868.4, 100%, 50%), -59px 347px hsl(1873.8, 100%, 50%), -59px 348px hsl(1879.2, 100%, 50%), -59px 349px hsl(1884.6, 100%, 50%), -60px 350px hsl(1890, 100%, 50%), -59px 351px hsl(1895.4, 100%, 50%), -59px 352px hsl(1900.8, 100%, 50%), -59px 353px hsl(1906.2, 100%, 50%), -59px 354px hsl(1911.6, 100%, 50%), -59px 355px hsl(1917, 100%, 50%), -58px 356px hsl(1922.4, 100%, 50%), -58px 357px hsl(1927.8, 100%, 50%), -58px 358px hsl(1933.2, 100%, 50%), -57px 359px hsl(1938.6, 100%, 50%), -57px 360px hsl(1944, 100%, 50%), -56px 361px hsl(1949.4, 100%, 50%), -55px 362px hsl(1954.8, 100%, 50%), -55px 363px hsl(1960.2, 100%, 50%), -54px 364px hsl(1965.6, 100%, 50%), -53px 365px hsl(1971, 100%, 50%), -52px 366px hsl(1976.4, 100%, 50%), -51px 367px hsl(1981.8, 100%, 50%), -50px 368px hsl(1987.2, 100%, 50%), -49px 369px hsl(1992.6, 100%, 50%), -48px 370px hsl(1998, 100%, 50%), -47px 371px hsl(2003.4, 100%, 50%), -46px 372px hsl(2008.8, 100%, 50%), -45px 373px hsl(2014.2, 100%, 50%), -43px 374px hsl(2019.6, 100%, 50%), -42px 375px hsl(2025, 100%, 50%), -41px 376px hsl(2030.4, 100%, 50%), -39px 377px hsl(2035.8, 100%, 50%), -38px 378px hsl(2041.2, 100%, 50%), -36px 379px hsl(2046.6, 100%, 50%), -35px 380px hsl(2052, 100%, 50%), -33px 381px hsl(2057.4, 100%, 50%), -32px 382px hsl(2062.8, 100%, 50%), -30px 383px hsl(2068.2, 100%, 50%), -28px 384px hsl(2073.6, 100%, 50%), -27px 385px hsl(2079, 100%, 50%), -25px 386px hsl(2084.4, 100%, 50%), -23px 387px hsl(2089.8, 100%, 50%), -22px 388px hsl(2095.2, 100%, 50%), -20px 389px hsl(2100.6, 100%, 50%), -18px 390px hsl(2106, 100%, 50%), -16px 391px hsl(2111.4, 100%, 50%), -14px 392px hsl(2116.8, 100%, 50%), -13px 393px hsl(2122.2, 100%, 50%), -11px 394px hsl(2127.6, 100%, 50%), -9px 395px hsl(2133, 100%, 50%), -7px 396px hsl(2138.4, 100%, 50%), -5px 397px hsl(2143.8, 100%, 50%), -3px 398px hsl(2149.2, 100%, 50%), -1px 399px hsl(2154.6, 100%, 50%); font-size: 40px;", "");

			this.setupExecuted = true;
		}

		getWindowColumnCount ()
		{
			let intColumnCount = 0,
				buildingCount = this.buildings.length;
			for (let i = 0; i < buildingCount; i++)
			{
				intColumnCount += this.buildings[i].windowColumnCount;
			}

			return intColumnCount;
		}

		/**
		 * Optional debug output show the frequency spectrum of
		 * the mic fft. Colors https://color.adobe.com/de/Terminal-Greens-color-theme-534321
		 */
		drawDebug()
		{
			this.spectrum = this.fft.analyze();
			noFill();

			let elementWidth = 400,
					elementHeight = 255;

			background('#F2F2F2');
			stroke('#1D736A');
			translate((width/2)- (elementWidth/2), elementHeight/2);
			beginShape();

			for (let i = 0; i < this.spectrum.length; i++)
			{
				let x = map(i, 0, this.spectrum.length, -(this.maxX), -(this.maxX) + elementWidth);
				vertex(100 + x, -1 * map(this.spectrum[i], 0, 255, 0, elementHeight));
			}
			endShape();
		}



		draw ()
		{
			let fps = frameRate();

			if (frameCount % 10 === 0)
			{
				debugFpsArray.push(fps);
				if (fps < 12)
				{
					//let errorMessage = 'Your graphics card is too slow for this city :P';
					//console.error(errorMessage, frameCount);
				}
			//console.info("FPS: " + fps.toFixed(2));

				if (debugFpsArray.length === 30)
				{
					let sum = 0;
					for (let i = 0; i < 30; i++)
					{
						sum += Math.floor(debugFpsArray[i]);
					}

				//	console.info("FPS: " + Math.floor(sum/30));
					debugFpsArray = [];
				}
			}

//			if (frameCount % 3 === 0 || frameCount === 0) {
				this.spectrum = this.fft.analyze();

			let vol = this.mic.getLevel();
			if (vol < this.microphoneThreshold)
			{
				vol = 0;
			}

			vol *= 2;

			background(this.backgroundColor);

			// <1ms
			if (this.textureBackgroundPane)
			{
				texture(this.textureBackgroundPane);
				plane(width, height);
			}

			// ~20ms
			let numberOfStars = this.stars.length;
			for (let i = 0; i < numberOfStars; i++)
			{
				this.stars[i].draw();
			}

			// shooting stars appear a) when it get's loud and b) randomly
			if ((frameCount % this.shootingStarFrameCount === 0) && (this.shootingStars.length <= 5 && (vol > this.shootingStarThreshold || Math.random() > (1 - this.shootingStarPropability))))
			{
				this.shootingStars.push(new ShootingStar(this.maxX, this.maxY));
			}

			let currentShootingStar;

			let numberOfShootingStars = this.shootingStars.length;
			for (let i = 0; i < numberOfShootingStars; i++)
			{
				currentShootingStar = this.shootingStars[i];
				currentShootingStar.draw();
				if (currentShootingStar.isDead())
				{
					this.shootingStars.splice(i, 1);
					--numberOfShootingStars;
				}
			}

			let litWindows = [];
			if (this.spectrum && this.spectrum.length > 0)
			{
				litWindows = this.distributeFrequenciesToAvailableWindows(this.spectrum);
			}

			this.drawMoon(vol);

			let numberOfBuildings = this.buildings.length,
				currentBuilding;
			for (let i = 0; i < numberOfBuildings; i++)
			{
				currentBuilding = this.buildings[i];
				if ((frameCount % 30 === 0) && !crewActive && !currentBuilding.isPainted && Math.random() > 0.6)
				{
					currentBuilding.startGraffitiAction();
				}

				currentBuilding.draw(litWindows);
			}

			if (this.train.isActive)
			{
				this.train.draw();
			}
			else if (true || (frameCount % this.trainDepartureTimeout) === 0 && !this.trainBlock && (Math.random() > this.trainCancellationLimit))
			{
				this.train.depart();
			}

return;
			let t = frameCount / 60; // update time

			// create a random number of snowflakes each frame
			if (frameCount % 30 === 0 && snowflakes.length < 20)
			{
				// todo: fix this global array stuff
				let newFlakeCount = Math.ceil(random(1, 2));
				for (var i = 0; i < newFlakeCount; i++)
				{
					snowflakes.push(new Snowflake()); // append snowflake object
				}
			}
			if (snowflakes.length > 0) {
				fill('#FFF');
				for (let flake of snowflakes) {
					flake.display(t);
				}
			}

			/*
			NO WALLS YET ...
			noStroke();
			stroke('#313A3F');
			strokeWeight(4);
			fill('#455159');
			rect(400, maxY-80, 700, 80);
			*/
		}

		/**
		 * Distributes the given frequency bins (see fft.analyze()) to the
		 * available window columns. Bins are merged by calculating the average.
		 *
			 * s/o Benni E. for these hot linez! https://github.com/engebeni
		 *
		 * @param _spectrum Array of frequency bins (float)
		 * @returns {Array} all tha lit windows
		 */
		distributeFrequenciesToAvailableWindows (_spectrum)
		{
			var windowColumnCount = this.getWindowColumnCount(),
			windowRange  = Math.floor(_spectrum.length / windowColumnCount),
				currentRange = 0,
				newRange     = 0,
				litWindows = [],
				valueSum, i, j;
			// todo: fix

			windowColumnCount--;

			if (frameCount % 15 === 0)
			{
			//	console.log(_spectrum.length);
			//	console.log(windowRange);
			}

			// distribute the frequency spectrum to the available window columns
			for (i = 0; i < windowColumnCount; i++)
			{
				newRange += (windowRange);
				valueSum = 0;

				if (frameCount % 15 === 0) {
					//console.log(_spectrum);
				}

				for (j = currentRange; j < newRange; j++)
				{
					valueSum += _spectrum[j];
				}

				// we artificially boost the signal here
				valueSum *= 10;
				if ((newRange - currentRange) > 0)
				{
					litWindows[i] = (valueSum / (newRange - currentRange));
				}
				else
				{
					throw new Error('This shouldn\'t happen here?!? Division by zero');
				}

				currentRange = newRange;
			}

			if (frameCount % 15 === 0) {
				//console.log(litWindows);
			}
			return litWindows;
		}

		/**
		 * Draws a moon that moves along a given trajectory.
		 * The moon size and transparency is affected by the microphone signal amplitude.
		 *
		 * @param vol Amplitude of the microphone signal as float from 0 to 1
		 */
		drawMoon(vol)
		{
			push();

			// https://stackoverflow.com/questions/839899/how-do-i-calculate-a-point-on-a-circle-s-circumference
			this.moonAngle += this.moonTrajectoryRadius;

			// better performance than Vector.Add()
			this.moonPosition.x += (this.moonTempo * cos(this.moonAngle));
			this.moonPosition.y += (this.moonTempo * sin(this.moonAngle));

			let moonSizeDifference = 15,
				currentMoonSize = map(vol, 0, 1, (this.moonSize - moonSizeDifference), this.moonSize),
				innerMoonSize = (currentMoonSize - (2 * moonSizeDifference));

			noStroke();

		/*	fill('rgba(242, 236, 216, 0.25)');
			rect(this.moonPosition.x + (this.moonSize / 2), this.moonPosition.y, 200, -50);
			text(this.moonPosition.x + (this.moonSize / 2), this.moonPosition.y, 'y x + mt²');
*/
			let moonVertices = 40;

			// draw outer moon circle
			fill('rgba(242, 236, 216, 0.1)');
			ellipse(this.moonPosition.x, this.moonPosition.y, currentMoonSize, currentMoonSize, moonVertices, moonVertices);

			// draw inner moon circle
			fill('rgba(242, 236, 216, ' + map(vol, 0.25, 1, 0.8, 1) + ')');
			ellipse(this.moonPosition.x, this.moonPosition.y, innerMoonSize, innerMoonSize, moonVertices, moonVertices);

			// reset the moon position as soon as it's outside the viewport (move it back to the left)
			if (!this.earthquakeActive && (this.moonPosition.x > (this.maxX + currentMoonSize) || this.moonPosition.y > (this.maxY + this.moonSize)))
			{
				this.moonPosition.x = (-this.maxX - (this.moonSize / 2));
				this.moonPosition.y = -200;
				this.moonAngle = 0;
			}

			pop();
		};

		showDialog (title, message, buttonText, callback) {
			let dialogButtons = {};

			if (buttonText !== '') {
				dialogButtons[buttonText] = callback;
			}

			$('<div><h1>' + title + '</h1><p>' + message + '</p></div>').dialog({
					  modal  : true,
					  show   : {
						  effect  : 'fade',
						  duration: 1000
					  },
					  hide   : {
						  effect  : 'fade',
						  duration: 1000
					  },
					  buttons: dialogButtons
			});
		}

		/**
		 * Starts an earthquake that destroys the city.
		 */
		earthquake () {
			if (!this.earthquakeActive) {
				let earthquakeCount = 1;
				if (localStorage.getItem('earthquakes') === null) {
					localStorage.setItem('earthquakes', 1);
				}
				else {
					earthquakeCount = parseInt(localStorage.getItem('earthquakes'), 10);
					localStorage.setItem('earthquakes', ++earthquakeCount);
				}

				this.earthquakeActive = true;
				console.error('oh no! everybody is dead =(');

				switch (earthquakeCount) {
					case 1:
						this.showDialog('Why did you do that?', 'You caused an earthquake that killed everybody.', 'It won\'t happen again', function () {
							window.location.reload();
						});
						break;
					case 2:
						this.showDialog('You did it again?', 'You better stop doing this before something worse happens.', 'Ok I got it', function () {
							window.location.reload();
						});
						break;
					case 3:
						this.showDialog('Last chance!', 'Your actions will have consequences.', 'I\'m sorry', function () {
							window.location.reload();
						});
						break;
					default:
						this.showDialog('That\'s it!', 'You did it one too many times.', 'Oops', function () {
							localStorage.setItem('drawBlock', 1);
							window.location.reload();
						});
						break;
				}

				this.textureBackgroundPane = createBackgroundGradient(width, height, color('#FF0000'), this.backgroundColor);
				this.moonTempo = 15;
				this.moonTrajectoryRadius = 0.005;

				crewActionBlock = true;
				crewActive = false;

				if (this.train && this.train.earthquake) {
					this.train.earthquake();
				}

				if (this.buildings) {
					for (let i = 0; i < this.buildings.length; i++) {
						this.buildings[i].earthquake();
					}
				}
			}
		}
	}

	/**
	 *
	 * @param _width int Width
	 * @param _height int Height
	 * @param _lerpToColor p5.Color Color instance
	 * @param _lerpFromColor p5.Color Color instance
	 * @returns {p5.Graphics}
	 */
	function createBackgroundGradient(_width, _height, _lerpToColor, _lerpFromColor)
	{
		let textureBackgroundPlane = createGraphics(_width, _height);
		let steps = 175,
				diameter,
				lerpValue,
				fillColor;

		for (let i = 0; i < steps; i++)
		{
			diameter = map(i, 0, steps, _width * 1.5, 1);
			lerpValue = map(i, 0, steps, 0, 1);
			fillColor = lerpColor(_lerpFromColor, _lerpToColor, lerpValue);
			textureBackgroundPlane.fill(fillColor);
			textureBackgroundPlane.noStroke();
			textureBackgroundPlane.ellipse((_width / 2), (_height), diameter, diameter);
		}

		return textureBackgroundPlane;
	}

	class Train {

		/**
		 *
		 * @param _initialPosition p5.Vector
		 */
		constructor (_initialPosition)
		{
			console.info('choooo choooooooo');
			this.position = _initialPosition;
			this.initialPositionX = _initialPosition.x;
			this.initialPositionY = _initialPosition.y;
			this.trainCarLength = 658;
			this.trainHeight = 120;
			this.trainAccelerationVector = createVector(-10,0);
			this.isActive = false;

			this.trainWindowHeight = (this.trainHeight / 3);
			this.trainWindowWidth = (this.trainCarLength * 0.038);
			this.bottomDoorPadding = (this.trainWindowHeight / 10);
			this.doorPartWidth = (this.trainWindowWidth + 10);
			this.doorPartHeight = (this.trainWindowHeight + 10);

			this.trainLength = (2 * this.trainCarLength);
		}

		static drawLogo (_logoPositionX, _logoPositionY)
		{
			texture(textureTrainLogo);
			rect(_logoPositionX, _logoPositionY, 20, 24, 50); // lower part logo

			texture(textureBerlin);
			rect(_logoPositionX, _logoPositionY - 25, 20, 30, 50); // upper part logo
		}

		earthquake ()
		{
			this.isActive = false;
			this.trainBlock = true;
			this.draw = function () {};
		}

		drawDoor (_doorPositionX, _windowColor)
		{
			fill('#F0D722');
			stroke(_windowColor);
			rect(_doorPositionX, this.position.y - this.bottomDoorPadding, this.doorPartWidth, -(this.doorPartHeight)); // left lower part
			rect(_doorPositionX, this.position.y - 54, this.doorPartWidth, -(this.doorPartHeight)); // left upper part
			rect(_doorPositionX + this.doorPartWidth, this.position.y - this.bottomDoorPadding, this.doorPartWidth, -(this.doorPartHeight)); // right lower part
			rect(_doorPositionX + this.doorPartWidth, this.position.y - 54, this.doorPartWidth, -(this.doorPartHeight)); // right upper part
			fill(_windowColor);
			stroke('#F0D722');
			rect(_doorPositionX + 5, this.position.y - this.doorPartHeight - 10, this.trainWindowWidth, -(this.trainWindowHeight)); // left window
			rect(_doorPositionX + this.doorPartWidth + 5, this.position.y - this.doorPartHeight - 10, this.trainWindowWidth, -(this.trainWindowHeight)); // right window
		}

		drawWindow(_windowPositionX, _windowPositionY, _windowColor, _isSingle)
		{
			_isSingle = (_isSingle || false);
			let windowSize = (2 * this.trainWindowWidth);

			fill(_windowColor);
			stroke('#F0D722');
			rect(_windowPositionX, _windowPositionY, windowSize, -(this.trainWindowHeight), 15, 15, 15, 15, 1, 1); // left window

			if (!_isSingle) {
				rect(_windowPositionX + windowSize + 2, _windowPositionY, windowSize, -(this.trainWindowHeight), 15, 15, 15, 15, 1, 1);
			} // right window

			fill('#F0D722');
			rect(_windowPositionX, _windowPositionY - this.trainWindowHeight + (this.trainWindowHeight / 3), windowSize, -1, 15, 15, 15, 15, 1, 1); // left window

			if (!_isSingle) {
				rect(_windowPositionX + windowSize + 2, _windowPositionY - this.trainWindowHeight + (this.trainWindowHeight / 3), windowSize, -1, 15, 15, 15, 15, 1, 1);
			} // right window
		}

		depart ()
		{
			this.isActive = true;
		}

		draw () {
			push();

			this.position.x += this.trainAccelerationVector.x;
			this.position.y += this.trainAccelerationVector.y;

			let windowColor = '#111';
			fill('#F0D722'); // yellow

			rect(this.position.x, this.position.y, this.trainCarLength, -this.trainHeight, 5, 5, 5, 5, 1, 1);

			stroke(windowColor);
			rect(this.position.x + 20, this.position.y - this.bottomDoorPadding, this.doorPartWidth, -(this.doorPartHeight)); // lower part driver door
			rect(this.position.x + 20, this.position.y - 54, this.doorPartWidth, -(this.doorPartHeight), 15, 15, 15, 15, 1, 1); // upper part driver door

			fill(windowColor);
			rect(this.position.x + 25, this.position.y - 60, this.trainWindowWidth, -(this.trainWindowHeight), 15, 15, 15, 15, 1, 1); // upper part driver door - window

			Train.drawLogo((this.position.x + 65), (this.position.y - 80));

			// 1. door
			this.drawDoor((this.position.x + 95), windowColor);

			// 1. window
			this.drawWindow((this.position.x + 180), (this.position.y - 60), windowColor);

			// 2. door
			this.drawDoor((this.position.x + 300), windowColor);

			// 2. window
			this.drawWindow((this.position.x + 390), (this.position.y - 60), windowColor);

			// 3. door
			this.drawDoor((this.position.x + 510), windowColor);

			// 3. window
			this.drawWindow((this.position.x + 595), (this.position.y - 60), windowColor, true);

			if (this.position.x < -((width / 2) + this.trainLength))
			{
				this.isActive = false;
				this.position.x = this.initialPositionX;
				this.position.y = this.initialPositionY;
			}

			pop();
		}
	}

	class ShootingStar {

		/**
		 * Draws a shooting star at a random position in the sky.
		 *
		 * @param _maxX int world X limit
		 * @param _maxY int world Y limit
		 */
		constructor (_maxX, _maxY) {
			let x        = random(-_maxX, _maxX),
				y        = random(-_maxY, 0),
				velocity = 3;

			this.size = 0;
			this.shrinkFactor = 0.25;
			this.position = createVector(x, y);
			this.color = color('rgba(242, 236, 216, ' + random(0.6, 1) + ')');
			this.isGrowing = true;
			this.maxSize = Math.floor(random(2,5));

			// randomly shoot the star to the left or right side
			this.acceleration = createVector((Math.random() > 0.5 ? velocity : -velocity), random(0, 2));
		}

		isDead() {
			return (!this.isGrowing && this.size < 0);
		}

		draw()
		{
			if (this.isGrowing)
			{
				this.size += this.shrinkFactor;
				if (this.size === this.maxSize)
				{
					this.isGrowing = false;
				}
			}
			else
			{
				this.size -= this.shrinkFactor;
			}

			this.position.x += this.acceleration.x;
			this.position.y += this.acceleration.y;

			fill(this.color);
			ellipse(this.position.x, this.position.y, this.size, this.size);
		}
	}

	class Star {

		/**
		 * Creates a new star with the given dimensions at a random position.
		 * Sizes are randomized to make it feel more natural. Stars also sparkle
		 * which sadly makes them hard to optimize =(
		 *
		 * @param _size int star size
		 * @param _maxX int world X limit
		 * @param _maxY int world Y limit
		 */
		constructor(_size, _maxX, _maxY)
		{
			let x = random(-_maxX, _maxX),
					y = random(-_maxY, _maxY - 150);

			this.size = random(_size/2, _size);
			this.position = createVector(x, y);

			this.color = random(0.4, 0.8);
		}

		draw () {
			// updating the star color every frame wouldn't look natural!
			if (frameCount % 4 === 0)
			{
				this.color = random(0.4, 0.8);
			}

			// todo: eliminate this 'fill()' so we can get waaaaay more stars!! =(
			fill('rgba(255,255,255, ' + this.color + ')');
			ellipse(this.position.x, this.position.y, this.size, this.size);
		}
	}

	class Snowflake {
		// https://p5js.org/examples/simulate-snowflakes.html
		constructor() {
			// initialize coordinates
			this.posX = random(-width);
			this.posY = -(height / 2);
			this.initialangle = random(0, 2 * PI);
			this.size = random(2, 5);

			// radius of snowflake spiral
			// chosen so the snowflakes are uniformly spread out in area
			this.radius = sqrt(random(pow(width / 2, 2)));
		}

		display(time) {
			// x position follows a circle
			let w = 0.6; // angular speed
			let angle = w * time + this.initialangle;
			this.posX = this.radius * sin(angle);

			// different size snowflakes fall at slightly different y speeds
			this.posY += pow(this.size, 0.5);

			// delete snowflake if past end of screen
			if (this.posY > (height / 2)) {
				let index = snowflakes.indexOf(this);
				snowflakes.splice(index, 1);
			}
			ellipse(this.posX, this.posY, this.size);
		};
	}

	class Artist {
		constructor(_hoodieColor, _crewPositionX, _crewPositionY)
		{
			this.hoodieColor = _hoodieColor;
			this.positionX = _crewPositionX;
			this.positionY = _crewPositionY;
			this.speed = 1;
			this.isActive = true;
		}

		update ()
		{
			this.positionY += this.speed;
		}

		reachedTheGround ()
		{
			this.isActive = false;
		}

		draw (_isOnMural)
		{
			fill('#444');
			rect(this.positionX + 15, this.positionY, 5, 5, 50, 50, 50, 50, 1, 1); // head

			// hoodie color
			fill(this.hoodieColor);

			// limit arm movements to every n frames
			if (_isOnMural && frameCount % 5 === 0)
			{
				this.armposition = random(11, 13);
				rect(this.positionX + this.armposition, this.positionY, 2, 8, 1, 1); // arm
			}
			else if (_isOnMural && this.armposition)
			{
				rect(this.positionX + this.armposition, this.positionY, 2, 8, 1, 1); // arm
			}
			else if (this.armposition)
			{
				this.speed = 2;
				delete this.armposition;
			}

			rect(this.positionX + 13, this.positionY + 5, 9, 10, 10, 10, 50, 50, 1, 1); // torso

			fill('#1C232C');
			rect(this.positionX + 14, this.positionY + 15, 2, 6, 1, 1); // leg
			rect(this.positionX + 19, this.positionY + 15, 2, 6, 1, 1); // leg
		}
		}

	class TvTower {
		constructor(_initialPositionX, _color) {
			this.lowerPartheight = Math.floor(height * 0.43);

			// real baseplate is about 16% (32m) of the ~200m high shaft
			this.baseplateWidth = Math.floor(this.lowerPartheight * 0.16);
			
			this.baseplateWidth *= (windowWidth/windowHeight) / 2;

			this.lowerPartWidthDifference = Math.floor(this.baseplateWidth / 4);

			if (isNaN(this.baseplateWidth) || isNaN(this.lowerPartheight)) {
				throw new Error('Width or height calculation failed!');
			}



			this.initialPositionX1 = _initialPositionX; // bottom left
			this.initialPositionY1 = (height / 2);

			this.initialPositionX2 = _initialPositionX + this.lowerPartWidthDifference; // top left
			this.initialPositionY2 = (height / 2) - this.lowerPartheight;

			this.initialPositionX3 = _initialPositionX + this.baseplateWidth - this.lowerPartWidthDifference; // top right
			this.initialPositionY3 = (height / 2) - this.lowerPartheight;

			this.initialPositionX4 = _initialPositionX + this.baseplateWidth; // bottom right
			this.initialPositionY4 = (height / 2);

			this.accelerationVector = {};

			let quadTopLength = (this.initialPositionX3 - this.initialPositionX2),
			quadTopMiddle = (quadTopLength / 2);

			this.ellipseWidth = (this.lowerPartheight / 3);
			this.ellipseHeight = (this.ellipseWidth);
			this.quadTopMiddleX1 = (this.initialPositionX2 + quadTopMiddle);
			this.initialPositionEllipseY1 = (this.initialPositionY2 - (this.ellipseWidth / 3));

			this.rectWidth = (this.initialPositionX3 - this.initialPositionX2) + 10;
			this.rectHeight = (-(this.lowerPartheight / 16));
			this.initialPositionRectBelowEllipseY1 = (this.initialPositionEllipseY1 + (this.lowerPartheight / 4));

			let antennaLength = (this.lowerPartheight * 0.6),
			antennaWidthBottom = 6,
			antennaWidthDifferenceTop = (antennaWidthBottom / 2);

			// todo: Mitte der Antennen-Grundfläche berechnen und auf die X-Position addieren
			this.antennaPositionBottomLeftX = (this.initialPositionX2 + 8); // top left + n
			this.antennaPositionBottomY = (this.initialPositionEllipseY1 - (this.lowerPartheight / 4));
			this.antennaPositionTopLeftX = (this.antennaPositionBottomLeftX + antennaWidthDifferenceTop);
			this.antennaPositionTopY = (this.antennaPositionBottomY - antennaLength);
			this.antennaPositionTopRightX = (this.antennaPositionTopLeftX + antennaWidthDifferenceTop);
			this.antennaPositionBottomRightX = (this.antennaPositionTopLeftX + antennaWidthBottom);

			this.color = _color;

		}

		draw() {
			push();
			smooth();

			// set the building color and draw the building wall
			fill(this.color);
			quad(this.initialPositionX1, this.initialPositionY1, this.initialPositionX2, this.initialPositionY2, this.initialPositionX3, this.initialPositionY3, this.initialPositionX4, this.initialPositionY4, 200, 200);

			rectMode(CENTER);
			rect(this.quadTopMiddleX1, this.initialPositionRectBelowEllipseY1, this.rectWidth, this.rectHeight);

			ellipse(this.quadTopMiddleX1, this.initialPositionEllipseY1, this.ellipseWidth, this.ellipseHeight, 20);

			quad(this.antennaPositionBottomLeftX, this.antennaPositionBottomY, this.antennaPositionTopLeftX, this.antennaPositionTopY, this.antennaPositionTopRightX, this.antennaPositionTopY, this.antennaPositionBottomRightX, this.antennaPositionBottomY);
//fill('#FF0000');

			// todo: Position dynamisch
			rect(this.quadTopMiddleX1, this.antennaPositionBottomY + 15, 20, -30);

			pop();
		}

		earthquake() {
			this.accelerationVector = createVector(random(-1, 1), 5);

			// replace the draw method to move the building
			this._draw = this.draw;
			this.draw = this.drawEarthquake;
		}

		drawEarthquake() {
			this.initialPositionX1 += this.accelerationVector.x;
			this.initialPositionY1 += this.accelerationVector.y;
			this.initialPositionX2 += this.accelerationVector.x;
			this.initialPositionY2 += this.accelerationVector.y;
			this.initialPositionX3 += this.accelerationVector.x;
			this.initialPositionY3 += this.accelerationVector.y;
			this.initialPositionX4 += this.accelerationVector.x;
			this.initialPositionY4 += this.accelerationVector.y;

			let quadTopLength = (this.initialPositionX3 - this.initialPositionX2),
			quadTopMiddle = (quadTopLength / 2);

			this.quadTopMiddleX1 = (this.initialPositionX2 + quadTopMiddle);

			this.initialPositionEllipseY1 += this.accelerationVector.y;
			this.initialPositionRectBelowEllipseY1 += this.accelerationVector.y;

			this.antennaPositionBottomLeftX += this.accelerationVector.x;
			this.antennaPositionBottomY += this.accelerationVector.y;
			this.antennaPositionBottomRightX += this.accelerationVector.x;
			this.antennaPositionTopLeftX += this.accelerationVector.x;
			this.antennaPositionTopY += this.accelerationVector.y;
			this.antennaPositionTopRightX += this.accelerationVector.x;
			this._draw();
		}

		startGraffitiAction() {
			return;
		}
	}

	class Building
	{
		/**
		 * Draws a rectangular building.
		 * Housenumbers are used for the elumination-functionality that the windows have.
		 *
		 * @param _initialPositionX int Initial X Position
		 * @param _rooms int Number of rooms (width)
		 * @param _stories int Number of stories (height)
		 * @param _color string Building color
		 * @param _houseNumber int (Optional) Housenumber (only if _hasWindows === true)
		 * @param _hasWindows boolean (Optional) Draw windows yes/no (Default = false)
		 */
		constructor(_initialPositionX, _rooms, _stories, _color, _houseNumber, _hasWindows)
		{
			if (_rooms < 0 || _stories < 0)
			{
				throw new Error('# stories and rooms of a building have to be > 0');
			}

			this.buildingWindowWidth = 10;
			this.buildingWindowHeight = 25;
			this.windowPadding = 5;

			this.width = (this.windowPadding * (_rooms + 1)) + (this.buildingWindowWidth * _rooms);
			this.height = 3 * (this.windowPadding * (_stories + 1)) + (this.buildingWindowHeight * _stories);

			if (isNaN(this.width) || isNaN(this.height))
			{
				throw new Error('Width or height calculation failed!');
			}

			this.initialPositionX = _initialPositionX;
			this.initialPositionY = (height/2);
			this.initialPosition = createVector(_initialPositionX, (height/2));

			this.color = _color;
			this.isPainted = false;
			this.houseNumber = _houseNumber;
			this.hasWindows = _hasWindows || false;
			this.accelerationVector = createVector(0,0);

			this.windows = [];

			// 15 shades of gray for the unlit window!
			this.initialWindowColor = random(5, 20);

			this.windowColor = this.initialWindowColor;
			this.windowColumnCount = 0;

			// if the building has windows, we calculate their (x,y) positions only once!
			if (this.hasWindows)
			{
				this.xPositionLimit = (this.width - (this.windowPadding + this.buildingWindowWidth));
				this.yPositionLimit = (this.height - (this.buildingWindowHeight + this.windowPadding));

				for (let j = 0, xPos = this.windowPadding; xPos <= this.xPositionLimit; j++, xPos = ((j+1) * this.windowPadding) + (j * this.buildingWindowWidth))
				{
					if (!this.windows[j])
					{
						++this.windowColumnCount;
						this.windows[j] = [];
					}

					for (let i = 0, yPos = this.windowPadding; yPos < this.yPositionLimit; i++, yPos = (((i+1) * this.windowPadding) + (i * (this.buildingWindowHeight))))
					{
						this.windows[j][i] = createVector(this.initialPosition.x + xPos, this.initialPosition.y - (this.height - yPos));
					}
				}
			}

			if (this.initialPositionX == null || this.initialPositionY == null || !this.width || !this.height)
			{
				throw new Error('House is missing position and/or size');
			}
			else if (!this.color)
			{
				throw new Error('House doesn\'t have a valid color!');
			}
		}

		earthquake ()
		{
			if (this.isPainted)
			{
				this.cleanUpGraffiti();
			}

			crewActionBlock = true;

			this.isPainted = false;
			this.muralTexture = null;
			this.hasWindows = false;
			this.accelerationVector = createVector(random(-1,1),5);

			// replace the draw method to move the building
			this._draw = this.draw;
			this.draw = this.drawEarthquake;
		}

		drawEarthquake (myLitWindows)
		{
			this.initialPosition.add(this.accelerationVector);
			this._draw(myLitWindows);
		}

		startGraffitiAction ()
		{
			if (this.hasWindows || crewActionBlock)
			{
				return;
			}

			console.info('ACTION!');

			this.muralsizeX = 40;
			this.muralsizeY = 100;

			crewActive = true;
			let crewPositionX = random(this.initialPositionX, (this.initialPositionX + (this.width - this.muralsizeX))),
			crewPositionY = (this.initialPositionY - this.height); // start on the roof

			this.ropeX1 = crewPositionX + 17;
			this.ropeY1 = crewPositionY;
			this.ropeLength = 0;

			let hoodieColor;
			if (Math.random() > 0.5)
			{
				hoodieColor = '#2B363D';
				this.muralTexture = imageTexture1;
			}
			else
			{
				hoodieColor = '#30324A';
				this.muralTexture = imageTexture1;
			}

			this.artist = new Artist(hoodieColor, crewPositionX, crewPositionY);

			this.isPainted = true;

			this.muralPosition = createVector((crewPositionX - 2), (crewPositionY + 20));

			this._draw = this.draw;
			this.draw = this.graffitiDraw;
		}

		graffitiDraw(myLitWindows)
		{
			this._draw(myLitWindows);

			this.artist.update();

			let artistPositionX = this.artist.positionX,
			artistPositionY = this.artist.positionY;

			if (this.isPainted)
			{
				texture(this.muralTexture);
				rect(this.muralPosition.x, this.muralPosition.y, this.muralsizeX, this.muralsizeY, 1, 1);
			}

			if (this.artist.isActive)
			{
				// 1. rect for the visible texture
				texture(this.muralTexture);
				rect(this.muralPosition.x, this.muralPosition.y, this.muralsizeX, this.muralsizeY, 1, 1);

				// 2. rect to hide everything that's 'not painted yet'
				fill(this.color);
				rect(artistPositionX, artistPositionY + 5, this.muralsizeX, (this.muralsizeY + 20), 1, 1);

				// rope color
				fill('#373740');

				this.ropeLength += this.artist.speed;
				rect(this.ropeX1, +this.ropeY1, 1, this.ropeLength);

				this.artist.draw((this.artist.positionY < (this.muralPosition.y + this.muralsizeY)));

				if (artistPositionY > this.initialPositionY)
				{
					console.info('police!');

					crewActive = false;
					crewActionBlock = true;

					this.artist.reachedTheGround();

					// todo: don't just delete the rope, make it disappear?
					delete this.rope;

					let me = this;
					setTimeout(function ()
							   {
								   me.endGraffitiAction();
							   }, Math.floor(random(5000, 10000)));
				}
			}
		}

		cleanUpGraffiti()
		{
			delete this.muralPosition;
			delete this.muralTexture;

			crewActionBlock = false;

			this.draw = this._draw;
		}

		endGraffitiAction ()
		{
			console.info('feds are gone');

			let me = this;
			setTimeout(function ()
					   {
						   me.cleanUpGraffiti();
					   }, Math.floor(random(10000, 20000)));
		}

		draw(myLitWindows)
		{
			// set the building color and draw the building wall
			fill(this.color);
			rect(this.initialPosition.x, this.initialPosition.y, this.width, -(this.height), 1, 1);

			if (!this.hasWindows)
			{
				return;
			}

			switch (this.houseNumber)
			{
				case 0:
					myLitWindows = myLitWindows.splice(0, 8);
					break;
				case 1:
					myLitWindows = myLitWindows.splice(8, 12);
					break;
				case 2:
					myLitWindows = myLitWindows.splice(13, myLitWindows.length);
					break;
			}

			let vector,
				isLit,
				numberOfWindowColumns,
				currentWindowRow,
				numberOfWindowRows = this.windows.length;

			// X-Plane
			for (let i = 0; i < numberOfWindowRows; i++)
			{
				isLit = (myLitWindows && myLitWindows[i]);

				// Y-Plane
				currentWindowRow = this.windows[i];
				numberOfWindowColumns = currentWindowRow.length;
				for (let j = 0; j < numberOfWindowColumns; j++)
				{
					// window position corresponds to the x and y values of the vector stored in the windows array
					vector = currentWindowRow[j];

					// we want to add some randomness to which window is lit
					if (isLit && Math.random() > 0.98)
					{
						isLit = false;
					}

					if (isLit)
					{
						this.windowColor = 255;
					}

					// todo: make this nicer and optimize the loop
					// different colors for the different rows. Upper rows will be of lighter color.
				/*	if (isLit && myLitWindows[i] > 200 && vector.y < this.windowLimitY1)
					{
						this.windowColor = 255;
					}
					else if (isLit && myLitWindows[i] > 100 && vector.y >= this.windowLimitY1 && vector.y < this.windowLimitY2)
					{
						this.windowColor = 150;
					}
					else if (isLit && myLitWindows[i] > 50 && this.windowLimitY2)
					{
						this.windowColor = 50;
					}*/
					this.windowColor = this.initialWindowColor;

					fill(this.windowColor);

					rect(vector.x, vector.y, this.buildingWindowWidth, this.buildingWindowHeight, 1, 1);
				}
			}
		}
	}


	class ParkInn {

		constructor(_initialPositionX, _rooms, _stories, _color) {

			if (_rooms < 0 || _stories < 0)
			{
				throw new Error('# stories and rooms of a building have to be > 0');
			}

			this.buildingWindowWidth = 10;
			this.buildingWindowHeight = 25;
			this.windowPadding = 5;

			this.width = (this.windowPadding * (_rooms + 1)) + (this.buildingWindowWidth * _rooms);
			this.height = 3 * (this.windowPadding * (_stories + 1)) + (this.buildingWindowHeight * _stories);

			if (isNaN(this.width) || isNaN(this.height))
			{
				throw new Error('Width or height calculation failed!');
			}

			this.initialPositionX = _initialPositionX;
			this.initialPositionY = (height/2);
			this.initialPosition = createVector(_initialPositionX, (height/2));

			this.color = _color;
			this.accelerationVector = createVector(0,0);

			this.upperPartMargin = 3;
			this.upperPartHeight = 15;
			this.upperPartWidth = (this.width - (this.width / 4));
			this.positionX1 = (this.initialPosition.x + (this.width / 8));
			this.positionY1 = (this.initialPosition.y - this.height - this.upperPartMargin);
			this.positionX3 = (this.positionX1 + this.upperPartWidth + 2);

			this.antennaHeight = (this.height / 4);
			this.antennaWidth = 5;

			if (this.initialPositionX == null || this.initialPositionY == null || !this.width || !this.height)
			{
				throw new Error('House is missing position and/or size');
			}
			else if (!this.color)
			{
				throw new Error('House doesn\'t have a valid color!');
			}
		}

		earthquake ()
		{
			if (this.isPainted)
			{
				this.cleanUpGraffiti();
			}

			crewActionBlock = true;

			this.isPainted = false;
			this.muralTexture = null;
			this.hasWindows = false;
			this.accelerationVector = createVector(random(-1,1),5);

			// replace the draw method to move the building
			this._draw = this.draw;
			this.draw = this.drawEarthquake;
		}

		drawEarthquake (myLitWindows)
		{
			this.initialPosition.add(this.accelerationVector);
			this.positionX1 += this.accelerationVector.x;
			this.positionX3 += this.accelerationVector.x;
			this.positionY1 += this.accelerationVector.y;
			this._draw(myLitWindows);
		}

		draw() {
			// set the building color and draw the building wall
			fill(this.color);
			rect(this.initialPosition.x, this.initialPosition.y, this.width, -(this.height), 1, 1);

			quad(this.positionX1, this.positionY1, this.positionX1 - 2, this.positionY1 - this.upperPartHeight, this.positionX3, this.positionY1 - this.upperPartHeight, this.positionX1 + this.upperPartWidth, this.positionY1);

			rect(this.positionX1 + 20, this.positionY1 - this.upperPartHeight, this.antennaWidth, -this.antennaHeight);
			rect(this.positionX3 - 30, this.positionY1 - this.upperPartHeight, this.antennaWidth, -this.antennaHeight);

			rect(this.positionX1 + ((this.width / 6) / 2), this.positionY1, this.upperPartWidth - (this.width / 6), this.upperPartMargin);
		}

		startGraffitiAction() {
			return;
		}
	}

	class Charite {

		constructor(_initialPositionX, _rooms, _stories, _color, _houseNumber, _hasWindows) {

			if (_rooms < 0 || _stories < 0)
			{
				throw new Error('# stories and rooms of a building have to be > 0');
			}

			this.buildingWindowWidth = 10;
			this.buildingWindowHeight = 25;
			this.windowPadding = 5;

			this.width = (this.windowPadding * (_rooms + 1)) + (this.buildingWindowWidth * _rooms);
			this.height = 3 * (this.windowPadding * (_stories + 1)) + (this.buildingWindowHeight * _stories);

			if (isNaN(this.width) || isNaN(this.height))
			{
				throw new Error('Width or height calculation failed!');
			}

			this.initialPositionX = _initialPositionX;
			this.initialPositionY = (height/2);
			this.initialPosition = createVector(_initialPositionX, (height/2));

			this.color = _color;
			this.isPainted = false;
			this.houseNumber = _houseNumber;
			this.hasWindows = _hasWindows || false;
			this.accelerationVector = createVector(0,0);

			this.windows = [];

			// 15 shades of gray for the unlit window!
			this.initialWindowColor = random(5, 20);

			this.windowColor = this.initialWindowColor;
			this.windowColumnCount = 0;

			if (this.initialPositionX == null || this.initialPositionY == null || !this.width || !this.height)
			{
				throw new Error('House is missing position and/or size');
			}
			else if (!this.color)
			{
				throw new Error('House doesn\'t have a valid color!');
			}

		}

		draw() {
			// set the building color and draw the building wall
			fill(this.color);
			rect(this.initialPosition.x, this.initialPosition.y, this.width, -(this.height), 1, 1);

			let positionX1 =this.initialPosition.x + (this.width / 10),
			positionY1 =(this.initialPosition.y - this.height);
			rect(positionX1, positionY1, this.width - (this.width / 5), -40);
		}

		earthquake() {
			if (this.isPainted) {
				this.cleanUpGraffiti();
			}

			crewActionBlock = true;

			this.isPainted = false;
			this.muralTexture = null;
			this.hasWindows = false;
			this.accelerationVector = createVector(random(-1, 1), 5);

			// replace the draw method to move the building
			this._draw = this.draw;
			this.draw = this.drawEarthquake;
		}

		drawEarthquake(myLitWindows) {
			this.initialPosition.add(this.accelerationVector);
			this._draw(myLitWindows);
		}
		startGraffitiAction() {
			return;
		}
	}
