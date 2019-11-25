//  OpenShift sample Node application
var express = require('express'),
    compress = require('compression'),
    sdk = require("playfab-sdk"),
    bodyParser = require('body-parser'),
    PlayFab = sdk.PlayFab;

var PlayFabClient = sdk.PlayFabClient;
var PlayFabServer = sdk.PlayFabServer;
var app = express();
app.use(compress());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ extended: false }));

PlayFab.settings.titleId = "40FFE";
PlayFab.settings.developerSecretKey = "QTK51JZINJCXWUT6INJK5HHZAKD5AZBKSAPEGQ8HW5WZRDK4TC";

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';



    /*

app.get('/', function (req, res) {
  res.render('index.html', { pageCountMessage : null});
});

app.use(function(err, req, res, next){
  res.status(500).send('Something bad happened!');
});



app.use("/api/hugo", function(req, res){

  res.send(JSON.stringify({alarm:"ok"}));

});

*/
app.listen(port, ip);
app.use("/api/hugo", function(req, res){

  res.send(JSON.stringify({alarm:"k"}));

});

app.use("/api/openchest", function(req, res){

  var containsLegend = false;
  var legendToCheck = null;
  var alreadyOwnsLegend = false;
  var usersCharacters = null;
  var notOwnedCharacters = [];
  var originalUnlockResult = null;
  var replacementCharacterIndex = null;
  var grantedResult = null;
  var characterToGrant = null;

  PlayFabServer.AuthenticateSessionTicket({
      SessionTicket:req.body.SessionTicket  
  }, onAuthResult);

  function onAuthResult(error, result) {
      if(!error) {
          PlayFabServer.UnlockContainerInstance({ContainerItemInstanceId:req.body.ItemInstanceId, PlayFabId: req.body.PlayFabId}, onUnlockResult);
      } else console.log(error);
  }

  function onUnlockResult(error, result){
      if(!error){
          originalUnlockResult = result;
          result.data.GrantedItems.forEach(function(item){
              if(item.ItemClass == "Legend") {
                  containsLegend = true;
                  legendToCheck = item;
              }
          });
          if(containsLegend) {
              PlayFabServer.GetAllUsersCharacters({PlayFabId:req.body.PlayFabId}, onCharactersResult);
          }
      } else res.send(error.errorMessage);
  }

  function onCharactersResult(error, result){
      if(!error){
          usersCharacters = result.data.Characters;
          result.data.Characters.forEach(function(character){
              if(character.CharacterType == legendToCheck.ItemId) {
                  alreadyOwnsLegend = true;
              }
          });
          if(alreadyOwnsLegend) {
              console.log("character already owned");
              PlayFabServer.GetCatalogItems({}, onCatalogResult);
          } else {
              characterToGrant = legendToCheck;
              GrantCharacter();
          }
      }
  }

  function GrantCharacter() {
      if(characterToGrant){
          PlayFabServer.GrantCharacterToUser({DisplayName: characterToGrant.DisplayName, CharacterType: characterToGrant.ItemId}, OnCharacterGranted);    
      } else{
          OnCharacterGranted();
      }
  }

  function OnCharacterGranted(error, result) {
      res.send(JSON.stringify(originalUnlockResult.data));
  }

  function onCatalogResult(error, result){
      if(!error) {

          var currentLegendRarity = null;

          result.data.Catalog.forEach(function(item){
              if(item.ItemId == legendToCheck.ItemId) {
                  currentLegendRarity = JSON.parse(item.CustomData).Rarity;
              }
          })
          console.log(currentLegendRarity);
          result.data.Catalog.forEach(function(item){
              if(item.ItemClass == "Legend" && !userOwnsCharacter(item) && JSON.parse(item.CustomData).Rarity == currentLegendRarity) {
                  notOwnedCharacters.push(item);
              }
          })
          if(notOwnedCharacters.length > 0) {
              replacementCharacterIndex = Math.floor(Math.random() * notOwnedCharacters.length);
              console.log("replacing with: " + notOwnedCharacters[replacementCharacterIndex].DisplayName);
              PlayFabServer.GrantItemsToUser({PlayFabId: req.body.PlayFabId, ItemIds:[notOwnedCharacters[replacementCharacterIndex].ItemId]}, onGrantedResult)
          } else {
              PlayFabServer.RevokeInventoryItem({PlayFabId:req.body.PlayFabId, ItemInstanceId:legendToCheck.ItemInstanceId}, onRevokeResult);
          }
      }
  }

  function onGrantedResult(error, result){
      if(!error){
          grantedResult = result;
          console.log("granted replacement");
          PlayFabServer.RevokeInventoryItem({PlayFabId:req.body.PlayFabId, ItemInstanceId:legendToCheck.ItemInstanceId}, onRevokeResult);
      } else console.log(error);
  }

  function onRevokeResult(error, result){
      if(!error) {
          console.log("revoked original character");
          for(var i = 0; i < originalUnlockResult.data.GrantedItems.length; i++) {
              if(originalUnlockResult.data.GrantedItems[i].ItemId == legendToCheck.ItemId) {
                  originalUnlockResult.data.GrantedItems.splice(i, 1);
                  break;
              }
          }
          if(grantedResult) {
              characterToGrant = grantedResult.data.ItemGrantResults[0];
              originalUnlockResult.data.GrantedItems.push(grantedResult.data.ItemGrantResults[0]);
          }
          GrantCharacter();
      }
  }

  function userOwnsCharacter(character) {
      for(var i = 0; i < usersCharacters.length; i++) {
          if(usersCharacters[i].CharacterType == character.ItemId) return true;
      }
      return false;
  }

});







module.exports = app ;