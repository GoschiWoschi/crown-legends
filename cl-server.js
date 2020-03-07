var sdk = require("playfab-sdk"),
    PlayFab = sdk.PlayFab,
    PlayFabClient = sdk.PlayFabClient,
    PlayFabServer = sdk.PlayFabServer;

PlayFab.settings.titleId = "13AB8";
PlayFab.settings.developerSecretKey = "X3KTR48KZ38UQHTSE6F35M75EMYTJZ9H4Y4UR4TZS77PXTRZUY";

var CLServer = function(){

    var players = [];

    function createPlayer(data) {

        for(var i = 0; i < players.length; i++){
            if(players[i].PlayFabId == data.PlayFabId) {
                players[i] = data;
                return;
            }
        }

        players.push(data);

    }

    this.Login = function(req, res){

        PlayFabClient.LoginWithEmailAddress({
            Email: req.query.Email,
            Password: req.query.Password
        }, function(error, data){
    
            if(error) res.send(error);
    
            else {
    
                createPlayer(data.data);
    
            }

    
            res.send(JSON.stringify(data));
    
        });
        
    }

    this.PurchaseItem = function(req, res) {

        PlayFab._internalSettings.entityToken = req.query.EntityToken;
        PlayFab._internalSettings.sessionTicket = req.query.SessionTicket;

        PlayFabClient.PurchaseItem({
            "ItemId": "CoinBundle1",
            "VirtualCurrency": "GG",
            "Price": 1
        }, function(error, data){


            if(error) {
                res.send(error);
            }

            res.send(JSON.stringify(data));

        });

    }

    this.OpenChest = function(req, res) {

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

    }

};

module.exports = CLServer;