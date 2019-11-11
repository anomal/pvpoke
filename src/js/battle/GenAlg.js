// JavaScript Document

/*
* This is the primary Ranker object that produces JSON ranking results for every league and category
* Recommend copying to a test or sandbox file to test new algorithms
*/

var RankerMaster = (function () {
    var instance;
 
    function createInstance() {
		
		
        var object = new rankerObject();
		
		function rankerObject(){
			var gm = GameMaster.getInstance();
			var battle = new Battle();
			
			var rankings = [];
			var rankingCombinations = [];
			
			var self = this;
			
			// Run all ranking sets at once
			
			this.rankLoop = function(cup){
				if(cup.name != "custom"){
					battle.setCup(cup.name);
				} else{
					battle.setCustomCup(cup);
				}
				
				var leagues = [1500, 2500, 10000];
				var shields = [ [0,0], [2,2], [0,2], [2,0]];

				for(var i = 0; i < leagues.length; i++){
					for(var n = 0; n < shields.length; n++){
						rankingCombinations.push({league: leagues[i], shields: shields[n]});

					}
				}
				
				var currentRankings = rankingCombinations.length;
				
				var rankingInterval = setInterval(function(){
					if((rankingCombinations.length == currentRankings)&&(rankingCombinations.length > 0)){
						currentRankings--;
						
						self.rank(rankingCombinations[0].league, rankingCombinations[0].shields);
						
						rankingCombinations.splice(0, 1);
					}
				}, 1000);
				
			}		
			
			// Run an individual rank set
			
			this.rank = function(league, shields){
				
				var totalBattles = 0;
				
				var pokemonList = [];
				
				var shieldCounts = shields;
				
				var cup = battle.getCup();
				
				rankings = [];
				
				// Gather all eligible Pokemon
				battle.setCP(league);
				
				var minStats = 3000; // You must be this tall to ride this ride
				
				if(battle.getCP() == 1500){
					minStats = 1250;
				} else if(battle.getCP() == 2500){
					minStats = 2500;
				}
				
				// Don't allow these Pokemon into the Great League. They can't be trusted.
				
				var bannedList = ["mewtwo","giratina_altered","groudon","kyogre","rayquaza","garchomp","latios","latias","palkia","dialga","heatran","giratina_origin","darkrai"];
				var permaBannedList = ["burmy_trash","burmy_sandy","burmy_plant","wormadam_plant","wormadam_sandy","wormadam_trash","mothim","cherubi","cherrim_overcast","cherrim_sunny","shellos_east_sea","shellos_west_sea","gastrodon_east_sea","gastrodon_west_sea","hippopotas","hippowdon","leafeon","glaceon","rotom","rotom_fan","rotom_frost","rotom_heat","rotom_mow","rotom_wash","uxie","azelf","mesprit","regigigas","giratina_origin","phione","manaphy","darkrai","shaymin_land","shaymin_sky","arceus","arceus_bug","arceus_dark","arceus_dragon","arceus_electric","arceus_fairy","arceus_fighting","arceus_fire","arceus_flying","arceus_ghost","arceus_grass","arceus_ground","arceus_ice","arceus_poison","arceus_psychic","arceus_rock","arceus_steel","arceus_water","jirachi"]; // Don't rank these Pokemon at all yet
				
				// If you want to rank specfic Pokemon, you can enter their species id's here
				
				var allowedList = [];
				
				for(var i = 0; i < gm.data.pokemon.length; i++){
					
					if(gm.data.pokemon[i].fastMoves.length > 0){ // Only add Pokemon that have move data
						var pokemon = new Pokemon(gm.data.pokemon[i].speciesId, 0, battle);

						pokemon.initialize(battle.getCP());
						
						var stats = (pokemon.stats.hp * pokemon.stats.atk * pokemon.stats.def) / 1000;

						if(stats >= minStats){
							
							if((battle.getCP() == 1500)&&(bannedList.indexOf(pokemon.speciesId) > -1)){
								continue;
							}
							
							if((allowedList.length > 0) && (allowedList.indexOf(pokemon.speciesId) == -1)){
								continue;
							}

							if(permaBannedList.indexOf(pokemon.speciesId) > -1){
								continue;
							}
							
							if((cup != undefined && cup.name == "rainbow")&&( (pokemon.dex > 251) || (pokemon.speciesId.indexOf("alolan") > -1))){
								continue;
							}
							
							if((cup != undefined && cup.types.length > 0) && (cup.types.indexOf(pokemon.types[0]) < 0) && (cup.types.indexOf(pokemon.types[1]) < 0) ){	
								continue;
							}
							
							pokemonList.push(pokemon);
						}
					}
				}
				
				// For all eligible Pokemon, simulate battles and gather rating data

				// initialize population				

				var populationSize = 6;
				var pokemonPerTeam = 6;
				var teams = [];
				var versusResult = {};

				for (var i = 0; i < populationSize; i++) {
					var team = [];
					for (var j = 0; j < pokemonPerTeam; j++) {
						var pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
						var fastMovePool = pokemon.getFastMovePool();
						var fastMove = fastMovePool[Math.floor(Math.random() * fastMovePool.length)];
						pokemon.selectMove("fast", fastMove.moveId, 0);
						var chargedMovePool = pokemon.getChargedMovePool();
						var charged1 = chargedMovePool[Math.floor(Math.random() * chargedMovePool.length)];
						var charged2 = chargedMovePool[Math.floor(Math.random() * chargedMovePool.length)];
						var maxIterations = 10;
						var it = 0;
						while (charged2.moveId == charged1.moveId && it < maxIterations) {
							charged2 = chargedMovePool[Math.floor(Math.random() * chargedMovePool.length)];
							it++;
						}
						if (charged1.moveId > charged2.moveId) {
							var temp = charged1;
							charged1 = charged2;
							charged2 = temp;
						}
						pokemon.selectMove("charged", charged1, 0);
						pokemon.selectMove("charged", charged2, 1);
						console.log(getPokemonWithMovesId, pokemon.speciesId, fastMove.moveId, charged1.moveId, charged2.moveId);
						team.push(pokemon);
					}
					teams.push(team);
				}
			}

			
		};

		this.getPokemonWithMovesId = function(pokemonId, fast, charged1, charged2) {
			return pokemonId + "." + fast + "." + charged1 + "." + charged2;
		};

		this.getVersusId = function(pokemonId, fast, charged1, charged2, opponentPokemonId, oppfast, oppcharged1, oppcharged2) {
			return getPokemonWithMovesId(pokemonId, fast, charged1, charged2) + "-" + getPokemonWithMovesId(opponentPokemonId, oppfast, oppcharged1, oppcharged2);
		}
		
        return object;
	}
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();
