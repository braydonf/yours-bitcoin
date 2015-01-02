var ECDSA = require('../lib/ecdsa');
var Hash = require('../lib/hash');
var Keypair = require('../lib/keypair');
var Privkey = require('../lib/privkey');
var Pubkey = require('../lib/pubkey');
var Sig = require('../lib/sig');
var BN = require('../lib/bn');
var point = require('../lib/point');
var should = require('chai').should();
var vectors = require('./vectors/ecdsa');

describe("ECDSA", function() {

  it('should create a blank ecdsa', function() {
    var ecdsa = new ECDSA();
  });

  var ecdsa = new ECDSA();
  ecdsa.hashbuf = Hash.sha256(new Buffer('test data'));
  ecdsa.keypair = new Keypair();
  ecdsa.keypair.privkey = new Privkey({bn: BN().fromBuffer(new Buffer('fee0a1f7afebf9d2a5a80c0c98a31c709681cce195cbcd06342b517970c0be1e', 'hex'))});
  ecdsa.keypair.pubkey = new Pubkey({
    point: point(BN().fromBuffer(new Buffer('ac242d242d23be966085a2b2b893d989f824e06c9ad0395a8a52f055ba39abb2', 'hex')),
    BN().fromBuffer(new Buffer('4836ab292c105a711ed10fcfd30999c31ff7c02456147747e03e739ad527c380', 'hex')))
  });

  describe('#set', function() {
    
    it('should set hashbuf', function() {
      should.exist(ECDSA().set({hashbuf: ecdsa.hashbuf}).hashbuf);
    });

  });

  describe('#calci', function() {
    
    it('should calculate i', function() {
      ecdsa.randomK();
      ecdsa.sign();
      ecdsa.calci();
      should.exist(ecdsa.sig.i);
    });

    it('should calulate this known i', function() {
      var hashbuf = Hash.sha256(new Buffer('some data'));
      var r = BN('71706645040721865894779025947914615666559616020894583599959600180037551395766', 10);
      var s = BN('109412465507152403114191008482955798903072313614214706891149785278625167723646', 10);
      var ecdsa = new ECDSA();
      ecdsa.keypair = new Keypair();
      ecdsa.keypair.privkey = Privkey();
      ecdsa.keypair.privkey.bn = BN().fromBuffer(Hash.sha256(new Buffer('test')));
      ecdsa.keypair.privkey2pubkey();
      ecdsa.hashbuf = hashbuf;
      ecdsa.sig = new Sig({r: r, s: s});

      ecdsa.calci();
      ecdsa.sig.i.should.equal(1);
    });

  });

  describe('#fromString', function() {
    
    it('should to a round trip with to string', function() {
      var str = ecdsa.toString();
      var ecdsa2 = new ECDSA();
      ecdsa2.fromString(str);
      should.exist(ecdsa.hashbuf);
      should.exist(ecdsa.keypair);
    });

  });

  describe('#randomK', function() {
    
    it('should generate a new random k when called twice in a row', function() {
      ecdsa.randomK();
      var k1 = ecdsa.k;
      ecdsa.randomK();
      var k2 = ecdsa.k;
      (k1.cmp(k2) === 0).should.equal(false);
    });

    it('should generate a random k that is (almost always) greater than this relatively small number', function() {
      ecdsa.randomK();
      var k1 = ecdsa.k;
      var k2 = BN(Math.pow(2, 32)).mul(BN(Math.pow(2, 32))).mul(BN(Math.pow(2, 32)));
      k2.gt(k1).should.equal(false);
    });

  });

  describe('#deterministicK', function() {

    it('should generate the same deterministic k', function() {
      ecdsa.deterministicK();
      ecdsa.k.toBuffer().toString('hex').should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e');
    });

    it('should generate the same deterministic k if badrs is set', function() {
      ecdsa.deterministicK(0);
      ecdsa.k.toBuffer().toString('hex').should.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e');
      ecdsa.deterministicK(1);
      ecdsa.k.toBuffer().toString('hex').should.not.equal('fcce1de7a9bcd6b2d3defade6afa1913fb9229e3b7ddf4749b55c4848b2a196e');
      ecdsa.k.toBuffer().toString('hex').should.equal('727fbcb59eb48b1d7d46f95a04991fc512eb9dbf9105628e3aec87428df28fd8');
    });

    it('should compute this test vector correctly', function() {
      // test fixture from bitcoinjs
      // https://github.com/bitcoinjs/bitcoinjs-lib/blob/10630873ebaa42381c5871e20336fbfb46564ac8/test/fixtures/ecdsa.json#L6
      var ecdsa = new ECDSA();
      ecdsa.hashbuf = Hash.sha256(new Buffer('Everything should be made as simple as possible, but not simpler.'));
      ecdsa.keypair = Keypair().fromPrivkey(Privkey().set({bn: BN(1)}));
      ecdsa.deterministicK();
      ecdsa.k.toBuffer().toString('hex').should.equal('ec633bd56a5774a0940cb97e27a9e4e51dc94af737596a0c5cbb3d30332d92a5');
      ecdsa.sign();
      ecdsa.sig.r.toString().should.equal('23362334225185207751494092901091441011938859014081160902781146257181456271561');
      var Point = require('../lib/point');
      ecdsa.sig.s.toString().should.equal('50433721247292933944369538617440297985091596895097604618403996029256432099938');
    });

  });

  describe('#sig2pubkey', function() {

    it('should calculate the correct public key', function() {
      ecdsa.k = BN('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10);
      ecdsa.sign();
      ecdsa.sig.i = 0;
      var pubkey = ecdsa.sig2pubkey();
      pubkey.point.eq(ecdsa.keypair.pubkey.point).should.equal(true);
    });

    it('should calculate the correct public key for this signature with low s', function() {
      ecdsa.k = BN('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10);
      ecdsa.sig = Sig().fromString('3045022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f6650220278cf15b05ce47fb37d2233802899d94c774d5480bba9f0f2d996baa13370c43');
      ecdsa.sig.i = 0;
      var pubkey = ecdsa.sig2pubkey();
      pubkey.point.eq(ecdsa.keypair.pubkey.point).should.equal(true);
    });

    it('should calculate the correct public key for this signature with high s', function() {
      ecdsa.k = BN('114860389168127852803919605627759231199925249596762615988727970217268189974335', 10);
      ecdsa.sign();
      ecdsa.sig = Sig().fromString('3046022100ec3cfe0e335791ad278b4ec8eac93d0347a97877bb1d54d35d189e225c15f665022100d8730ea4fa31b804c82ddcc7fd766269f33a079ea38e012c9238f2e2bcff34fe');
      ecdsa.sig.i = 1;
      var pubkey = ecdsa.sig2pubkey();
      pubkey.point.eq(ecdsa.keypair.pubkey.point).should.equal(true);
    });

  });

  describe('#verifystr', function() {

    it('should return an error if the hash is invalid', function() {
      var ecdsa = new ECDSA();
      ecdsa.verifystr().should.equal('hashbuf must be a 32 byte buffer');
    });

    it('should return an error if the pubkey is invalid', function() {
      var ecdsa = new ECDSA();
      ecdsa.hashbuf = Hash.sha256(new Buffer('test'));
      ecdsa.verifystr().indexOf("Invalid pubkey").should.equal(0);
    });

    it('should return an error if r, s are invalid', function() {
      var ecdsa = new ECDSA();
      ecdsa.hashbuf = Hash.sha256(new Buffer('test'));
      var pk = new Pubkey();
      pk.fromDER(new Buffer('041ff0fe0f7b15ffaa85ff9f4744d539139c252a49710fb053bb9f2b933173ff9a7baad41d04514751e6851f5304fd243751703bed21b914f6be218c0fa354a341', 'hex'));
      ecdsa.keypair = new Keypair();
      ecdsa.keypair.pubkey = pk;
      ecdsa.sig = new Sig();
      ecdsa.sig.r = BN(0);
      ecdsa.sig.s = BN(0);
      ecdsa.verifystr().should.equal("r and s not in range");
    });

    it('should return an error if the signature is incorrect', function() {
      ecdsa.sig = new Sig();
      ecdsa.sig.fromString('3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827');
      ecdsa.sig.r = ecdsa.sig.r.add(BN(1));
      ecdsa.verifystr().should.equal("Invalid signature");
    });

  });

  describe('#sign', function() {
    
    it('should create a valid signature', function() {
      ecdsa.randomK();
      ecdsa.sign();
      ecdsa.verify().verified.should.equal(true);
    });

    it('should should throw an error if hashbuf is not 32 bytes', function() {
      var ecdsa2 = ECDSA().set({
        hashbuf: ecdsa.hashbuf.slice(0, 31),
        keypair: ecdsa.keypair
      });
      ecdsa2.randomK();
      (function() {
        ecdsa2.sign();
      }).should.throw('hashbuf must be a 32 byte buffer');
    });

    it('should default to deterministicK', function() {
      var ecdsa2 = new ECDSA(ecdsa);
      ecdsa2.k = undefined;
      var called = 0;
      var deterministicK = ecdsa2.deterministicK.bind(ecdsa2);
      ecdsa2.deterministicK = function() {
        deterministicK();
        called++;
      };
      ecdsa2.sign();
      called.should.equal(1);
    });

  });

  describe('#signRandomK', function() {

    it('should produce a signature, and be different when called twice', function() {
      ecdsa.signRandomK();
      should.exist(ecdsa.sig);
      var ecdsa2 = ECDSA(ecdsa);
      ecdsa2.signRandomK();
      ecdsa.sig.toString().should.not.equal(ecdsa2.sig.toString());
    });

  });

  describe('#toString', function() {
    
    it('should convert this to a string', function() {
      var str = ecdsa.toString();
      (typeof str === 'string').should.equal(true);
    });

  });

  describe('#verify', function() {
    
    it('should verify a signature that was just signed', function() {
      ecdsa.sig = new Sig();
      ecdsa.sig.fromString('3046022100e9915e6236695f093a4128ac2a956c40ed971531de2f4f41ba05fac7e2bd019c02210094e6a4a769cc7f2a8ab3db696c7cd8d56bcdbfff860a8c81de4bc6a798b90827');
      ecdsa.verify().verified.should.equal(true);
    });

    it('should verify this known good signature', function() {
      ecdsa.signRandomK();
      ecdsa.verify().verified.should.equal(true);
    });

  });

  describe('@sign', function() {
    
    it('should produce a signature', function() {
      var sig = ECDSA.sign(ecdsa.hashbuf, ecdsa.keypair);
      (sig instanceof Sig).should.equal(true);
    });

  });

  describe('@verify', function() {

    it('should verify a valid signature, and unverify an invalid signature', function() {
      var sig = ECDSA.sign(ecdsa.hashbuf, ecdsa.keypair);
      ECDSA.verify(ecdsa.hashbuf, sig, ecdsa.keypair.pubkey).should.equal(true);
      var fakesig = Sig(sig.r.add(1), sig.s);
      ECDSA.verify(ecdsa.hashbuf, fakesig, ecdsa.keypair.pubkey).should.equal(false);
    });

    it('should work with big and little endian', function() {
      var sig = ECDSA.sign(ecdsa.hashbuf, ecdsa.keypair, 'big');
      ECDSA.verify(ecdsa.hashbuf, sig, ecdsa.keypair.pubkey, 'big').should.equal(true);
      ECDSA.verify(ecdsa.hashbuf, sig, ecdsa.keypair.pubkey, 'little').should.equal(false);
      sig = ECDSA.sign(ecdsa.hashbuf, ecdsa.keypair, 'little');
      ECDSA.verify(ecdsa.hashbuf, sig, ecdsa.keypair.pubkey, 'big').should.equal(false);
      ECDSA.verify(ecdsa.hashbuf, sig, ecdsa.keypair.pubkey, 'little').should.equal(true);
    });

  });

  describe('vectors', function() {

    vectors.valid.forEach(function(obj, i) {
      it('should validate valid vector ' + i, function() {
        var ecdsa = ECDSA().set({
          keypair: Keypair().fromPrivkey(Privkey().fromBN(BN().fromBuffer(new Buffer(obj.d, 'hex')))),
          k: BN().fromBuffer(new Buffer(obj.k, 'hex')),
          hashbuf: Hash.sha256(new Buffer(obj.message)),
          sig: Sig().set({
            r: BN(obj.signature.r),
            s: BN(obj.signature.s),
            i: obj.i
          })
        });
        var ecdsa2 = ECDSA(ecdsa);
        ecdsa2.k = undefined;
        ecdsa2.sign();
        ecdsa2.calci();
        ecdsa2.k.toString().should.equal(ecdsa.k.toString());
        ecdsa2.sig.toString().should.equal(ecdsa.sig.toString());
        ecdsa2.sig.i.should.equal(ecdsa.sig.i);
        ecdsa.verify().verified.should.equal(true);
      });
    });
    
    vectors.invalid.verifystr.forEach(function(obj, i) {
      it('should validate invalid.verifystr vector ' + i + ': ' + obj.description, function() {
        var ecdsa = ECDSA().set({
          keypair: Keypair().set({pubkey: Pubkey().set({point: point.fromX(true, 1)})}),
          sig: Sig(BN(obj.signature.r), BN(obj.signature.s)),
          hashbuf: Hash.sha256(new Buffer(obj.message))
        });
        ecdsa.verifystr().should.equal(obj.exception);
      });
    });

  });

});
