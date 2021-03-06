import { Template } from 'meteor/templating';
import { Currencies, Ratings } from '/imports/api/indexDB.js';

import './questions.html'

Template.question.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('approvedcurrencies');
  })

  this.cnt = 0
  this.ties = 0
})


Template.question.helpers({
  getLogo(img){
    if(img){
      return _coinUpoadDirectoryPublic + img;
    }else{
      return '/images/noimage.png'
    }
  },
  currency0(){
    return Currencies.findOne({_id: this.currency0Id});
  },
  currency1(){
    return Currencies.findOne({_id: this.currency1Id});
  },
    outstandingRatings() {
    var count = Ratings.find({
      $or: [{
        answered: false,
        catagory: 'wallet'
      }, {
        answered: false,
        context: 'wallet'
      }]
    }).count();
    if (!count) {
      $("#outstandingRatings").hide();
      $("#currencyChoices").show();
    };
    return count;
  }
});

Template.question.events({
  'mouseover .choice': function(){
    $('.choice').css('cursor', 'pointer');
  },
  'click .choice': function(event, templateInstance){
    if (event.currentTarget.id === 'tie') {
            templateInstance.ties++
        } else {
            templateInstance.ties = 0
        }

        Meteor.call('answerRating', this._id, event.currentTarget.id, (err, data) => {
            if (err && err.reason === 'xor') {
                if (templateInstance.cnt++ === 0) {
                    swal('Your answer is in contradiction with your previous answers. Please try again. If this persists, your progress will be purged and bounties will be nullified.')
                } else {
                    swal.error('Lazy answering detected. You\'ll have to start all over again.')
                    Meteor.call('deleteWalletRatings', (err, data) => {})

                    templateInstance.cnt = 0
                }
            }

            Cookies.set('workingBounty', false, { expires: 1 })

            if (templateInstance.ties > 10) { // ties can't be checked with XOR questions, as XOR only works on booleans. Nonetheless, if the user clicks on 'tie' 10 times in a row, it's safe to say that he/she is just lazy answering
                swal.error('Lazy answering detected. You\'ll have to start all over again.')
                Meteor.call('deleteWalletRatings', (err, data) => {})

                templateInstance.ties = 0
            }
        })
  }
});