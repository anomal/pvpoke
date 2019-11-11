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
				
				var leagues = [1500];//[1500, 2500, 10000];
				var shields = [[0,0]];//[ [0,0], [2,2], [0,2], [2,0]];

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
				var permaBannedList = ["escavalier","scrafty","seismitoad","stunfisk","mandibuzz","jellicent","rotom","rotom_fan","rotom_frost","rotom_heat","rotom_mow","rotom_wash","phione","manaphy","shaymin_land","shaymin_sky","arceus","arceus_bug","arceus_dark","arceus_dragon","arceus_electric","arceus_fairy","arceus_fighting","arceus_fire","arceus_flying","arceus_ghost","arceus_grass","arceus_ground","arceus_ice","arceus_poison","arceus_psychic","arceus_rock","arceus_steel","arceus_water","kecleon"]; // Don't rank these Pokemon at all yet

				var maxDexNumber = 493;
				var releasedGen5 = ["snivy","servine","serperior","tepig","pignite","emboar","oshawott","dewott","samurott","lillipup","herdier","stoutland","purrloin","liepard","pidove","tranquill","unfezant","blitzle","zebstrika","foongus","amoonguss","drilbur","excadrill","litwick","lampent","chandelure","golett","golurk","deino","zweilous","hydreigon","pansage","panpour","pansear","simisage","simipour","simisear","ferroseed","ferrothorn","heatmor","durant","patrat","watchog","klink","klang","klinklang","yamask","cofagrigus","cobalion","meltan","melmetal"];

				
				// If you want to rank specfic Pokemon, you can enter their species id's here
				
				var allowedList = [];
				var includeTypes = ["ghost", "psychic", "fighting", "steel"];
				var excludeTypes = ["dark"];
				var excludeIds = ["skarmory", "hypno"];
				var excludeTags = ["mythical"];

				
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

							if((pokemon.dex > maxDexNumber)&&(releasedGen5.indexOf(pokemon.speciesId) == -1)){//&&(cup != undefined && battle.getCup().name != "gen-5")){
								continue;
							}

							if ((includeTypes.indexOf(pokemon.types[0]) < 0 && includeTypes.indexOf(pokemon.types[1]) < 0) 
									|| excludeTypes.indexOf(pokemon.types[0]) > -1 || excludeTypes.indexOf(pokemon.types[1]) > -1
									|| excludeIds.indexOf(pokemon.speciesId) > -1
									|| excludeTags.indexOf(pokemon.tag) > -1) {
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

				for (var i = 0; i < populationSize; i++) {
					var team = [];
					for (var j = 0; j < pokemonPerTeam; j++) {
						var pokemon = getRandomPokemon(pokemonList);
						console.log(pokemon.speciesId, pokemon.fastMove.moveId, pokemon.chargedMoves[0].moveId, pokemon.chargedMoves[1].moveId);
						team.push(pokemon);
					}
					teams.push(team);
				}

				var versusResults = {};

				// run alg for x generations
				var generations = 16000;
				for (var gen=0; gen<generations; gen++) {
					if (gen % 100 == 0) {
						console.log("gen: " + gen);
					}
					var teamLen = teams.length;
					for (var t=0; t<teamLen; t++) {
						if (gen % 100 == 0) {
							console.log("Team" + t);
						}
						var team=teams[t];

						var mutatedTeam = [];
						var mutationIndex = gen % pokemonPerTeam;
						var s = "";
						for (var i=0; i<pokemonPerTeam; i++) {
							if (gen % 100 == 0) {
								s = s + getPokemonWithMovesId(team[i]) + ", ";
							}
							if (i == mutationIndex) {
								var pokemon = getRandomPokemon(pokemonList);
								mutatedTeam[i] = pokemon;
							} else {
								mutatedTeam[i] = team[i];

							}
						}

						if (gen % 100 == 0) {
							console.log(s);
						}

						var oldFitness = getFitness(team, pokemonList, versusResults);
						var newFitness = getFitness(mutatedTeam, pokemonList, versusResults);

						if (gen % 100 == 0) {
							console.log("Current fitness: " + oldFitness);
						}
						
						if (newFitness > oldFitness) {
							teams[t] = mutatedTeam;
						} 
					}
				}
				console.log(teams);

			}

			
		};

		this.randomizeMoves = function(pokemon) {
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
		}

		this.getRandomPokemon = function(pokemonList) {
			var pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
			var battle = new Battle();
			var myPokemon = new Pokemon(pokemon.speciesId, 0, battle);
			myPokemon.initialize(battle.getCP());
			this.randomizeMoves(myPokemon);
			return myPokemon;
		}

		this.getFitness = function(team, pokemonList, versusResults) {
			const teamWins = new Set();
			var teamLen = team.length;
			for (var m=0; m<teamLen; m++) {
				var pokemon = team[m];
				var pokemonListLen = pokemonList.length;
				for (var opp=0; opp<pokemonListLen; opp++) {
					var opponent = pokemonList[opp];
					var versusId = getVersusId(pokemon, opponent);
					var versusResult = versusResults[versusId];
					if (versusResult != undefined) {
						//console.log(versusId + " found");
 						if (versusResult > 500) {
							teamWins.add(opponent.speciesId);
						}
					} else {
						//console.log(versusId + " not found");
						var battle = new Battle();
						battle.setNewPokemon(pokemon,0);
						battle.setNewPokemon(opponent,1);
						
						opponent.autoSelectMoves();

						var minResult = null;
						for (var s=0; s<=2; s++) {
							pokemon.setShields(s);
							opponent.setShields(s);
							battle.simulate();

							// Calculate Battle Rating for each Pokemon
				
							var healthRating = (pokemon.hp / pokemon.stats.hp);
							var damageRating = ((opponent.stats.hp - opponent.hp) / (opponent.stats.hp));
				
							var opHealthRating = (opponent.hp / opponent.stats.hp);
							var opDamageRating = ((pokemon.stats.hp - pokemon.hp) / (pokemon.stats.hp));
				
							var rating = Math.floor( (healthRating + damageRating) * 500);
							var opRating = Math.floor( (opHealthRating + opDamageRating) * 500);
				
							// Modify ratings by shields burned and shields remaining
				
							var winMultiplier = 1;
							var opWinMultiplier = 1;
				
							if(rating > opRating){
								opWinMultiplier = 0;
							} else{
								winMultiplier = 0;
							}
				
							var adjRating = rating + ( (100 * (opponent.startingShields - opponent.shields) * winMultiplier) + (100 * pokemon.shields * winMultiplier));
							var adjOpRating = opRating + ( (100 * (pokemon.startingShields - pokemon.shields) * opWinMultiplier) + (100 * opponent.shields * opWinMultiplier));

							if (minResult == null || adjRating < minResult) {
								minResult = adjRating;
							}

						}
						versusResults[versusId] = minResult;
						if (minResult > 500) {
							teamWins.add(opponent.speciesId);
						}
					}
				}
			}
			return teamWins.size;
		}

		this.getPokemonWithMovesId = function(pokemon) {
			return pokemon.speciesId + "." + pokemon.fastMove.moveId + "." + pokemon.chargedMoves[0].moveId + "." + pokemon.chargedMoves[1].moveId;
		};

		this.getVersusId = function(pokemon, opponent) {
			return getPokemonWithMovesId(pokemon) + "-" + getPokemonWithMovesId(opponent);
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
