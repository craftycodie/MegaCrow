export const DEFAULT_SOURCE = `

;************
;* STRINGS  *
;************

string_table english
	option_name_round_time "Round Time Limit"
	option_description_round_time "Determines how long each round lasts."

	option_name_kill_points "Kill Points"
	option_description_kill_points "Points for killing an enemy."
	
	option_name_death_points "Death Points"
	option_description_death_points "Points for dying."
	
	option_name_suicide_points "Suicide Points"
	option_description_suicide_points "Points for killing yourself."
	
	option_name_betrayal_points "Betrayal Points"
	option_description_betrayal_points "Points for killing an ally."
	
	option_name_leader_kill_bonus "Leader Kill Bonus"
	option_description_leader_kill_bonus "Points for killing the player in the lead."

	option_name_headshot_bonus "Headshot Bonus"
	option_description_headshot_bonus  "Points for killing an enemy with a headshot."

	option_name_beatdown_bonus "Pummel Bonus"
	option_description_beatdown_bonus "Points for killing an enemy with a melee attack."
	
	option_name_assassination_bonus "Assassination Bonus"
	option_description_assassination_bonus "Points for killing an enemy with a special assassination."	
	
	option_name_splatter_bonus "Splatter Bonus"
	option_description_splatter_bonus "Points for killing an enemy with a moving object."
	
	option_name_sticky_bonus "Sticky Bonus"
	option_description_sticky_bonus "Points for sticking an enemy with a plasma grenade."
	
	option_name_spree_bonus "Spree Bonus"
	option_description_spree_bonus "Points for killing an enemy while on a spree."

	option_name_use_loadouts "Loadouts"
	option_description_use_loadouts "If enabled, allows players to choose their loadouts."

	option_name_arena_rating_enabled "Arena Rating"
	option_description_arena_rating_enabled "If enabled, this option records the Arena Rating for each player."
	
	option_name_use_shortcuts "Shortcuts"
	option_description_use_shortcuts "If enabled, objects marked as Shortcuts will appear in the game."
	
	option_name_use_powerups "Powerups"
	option_description_use_powerups "If enabled, allows special powerup objects to appear in the game."
	
	option_yes "Yes"
	option_no "No"

	option_enabled "Enabled"
	option_disabled "Disabled"

	option_timer_instant "Instant"
	option_timer_never "Never"
	option_timer_unlimited "Unlimited"
	
	timer_round_time "Round Time Expired"
	
	distance_to_target_text "%nm"	
	
	objective_team_offense "Offense"
	objective_team_defense "Defense"	

	objective_team_spartan "Spartan"
	objective_team_elite "Elite"

	objective_team_survivor "Survivor"
	objective_team_zombie "Zombie"
	objective_team_juggernaut "Juggernaut"
	objective_team_driver "Driver"	
	objective_team_gunner "Gunner"

	
	seconds_1 "1 second"
	seconds_2 "2 seconds"
	seconds_3 "3 seconds"
	seconds_4 "4 seconds"
	seconds_5 "5 seconds"
	seconds_6 "6 seconds"
	seconds_7 "7 seconds"
	seconds_8 "8 seconds"
	seconds_9 "9 seconds"
	seconds_10 "10 seconds"
	seconds_15 "15 seconds"
	seconds_20 "20 seconds"
	seconds_25 "25 seconds"
	seconds_30 "30 seconds"
	seconds_45 "45 seconds"
	
	seconds_90 "90 seconds"	
	
	minutes_1 "1 minute"
	minutes_2 "2 minutes"
	minutes_3 "3 minutes"
	minutes_4 "4 minutes"
	minutes_5 "5 minutes"
	minutes_6 "6 minutes"
	minutes_7 "7 minutes"
	minutes_8 "8 minutes"
	minutes_9 "9 minutes"
	minutes_10 "10 minutes"
	minutes_11 "11 minutes"
	minutes_12 "12 minutes"
	minutes_13 "13 minutes"
	minutes_14 "14 minutes"
	
	minutes_15 "15 minutes"
	minutes_20 "20 minutes"
	minutes_25 "25 minutes"
	minutes_30 "30 minutes"	
	minutes_45 "45 minutes"	
	minutes_60 "60 minutes"		
	
	kills_1 "1 kill"
	kills_2 "2 kills"
	kills_3 "3 kills"
	kills_4 "4 kills"
	kills_5 "5 kills"
	kills_6 "6 kills"
	kills_7 "7 kills"
	kills_8 "8 kills"
	kills_9 "9 kills"
	kills_10 "10 kills"
	kills_11 "11 kills"
	kills_12 "12 kills"
	kills_13 "13 kills"
	kills_14 "14 kills"
	kills_15 "15 kills"
	kills_20 "20 kills"
	kills_25 "25 kills"
	kills_50 "50 kills"		
	kills_75 "75 kills"	
	kills_100 "100 kills"	
	
	points_0 "no points"
	points_1 "1 point"
	points_2 "2 points"
	points_3 "3 points"
	points_4 "4 points"
	points_5 "5 points"
	points_6 "6 points"
	points_7 "7 points"
	points_8 "8 points"
	points_9 "9 points"
	points_10 "10 points"
	points_11 "11 points"
	points_12 "12 points"
	points_13 "13 points"
	points_14 "14 points"
	points_15 "15 points"
	points_20 "20 points"
	points_25 "25 points"
	points_50 "50 points"		
	points_75 "75 points"	
	points_100 "100 points"
	
	neg_points_1 "-1 point"
	neg_points_2 "-2 points"
	neg_points_3 "-3 points"
	neg_points_4 "-4 points"
	neg_points_5 "-5 points"
	neg_points_6 "-6 points"
	neg_points_7 "-7 points"
	neg_points_8 "-8 points"
	neg_points_9 "-9 points"
	neg_points_10 "-10 points"
	
	laps_1 "1 lap"
	laps_2 "2 laps"
	laps_3 "3 laps"
	laps_4 "4 laps"
	laps_5 "5 laps"
	laps_6 "6 laps"
	laps_7 "7 laps"
	laps_8 "8 laps"
	laps_9 "9 laps"
	laps_10 "10 laps"
	laps_15 "15 laps"
	laps_20 "20 laps"
	laps_25 "25 laps"
	laps_50 "50 laps"		
	laps_75 "75 laps"	
	laps_100 "100 laps"
	 	territories_1 "1 territory" 	territories_2 "2 territories" 	territories_3 "3 territories" 	territories_4 "4 territories" 	territories_5 "5 territories" 	territories_6 "6 territories" 	territories_7 "7 territories" 	territories_8 "8 territories" 	territories_9 "9 territories" 	territories_10 "10 territories"
	
	zombies_1 "1 zombie"
	zombies_2 "2 zombies"
	zombies_3 "3 zombies"
	zombies_4 "4 zombies"
	zombies_5 "5 zombies"
	zombies_6 "6 zombies"
	zombies_7 "7 zombies"
	zombies_8 "8 zombies"
	zombies_9 "9 zombies"
	zombies_10 "10 zombies"
	zombies_15 "15 zombies"

	balls_1 "1 ball"
	balls_2 "2 balls"
	balls_3 "3 balls"
	balls_4 "4 balls"
	balls_5 "5 balls"
	balls_6 "6 balls"
	balls_7 "7 balls"
	balls_8 "8 balls"
	balls_9 "9 balls"
	balls_10 "10 balls"	
	
	flags_1 "1 flag"
	flags_2 "2 flags"
	flags_3 "3 flags"
	flags_4 "4 flags"
	flags_5 "5 flags"
	flags_6 "6 flags"
	flags_7 "7 flags"
	flags_8 "8 flags"
	flags_9 "9 flags"
	flags_10 "10 flags"	
end

;************
;* STRINGS  *
;************

string_table english
	engine_name "VIP"
	engine_description "Very Important Person"

	vip_offense "Kill the enemy VIP for points.\\r\\n%n points to win."
	vip_defense "Defend your VIP.\\r\\n%n points to win."
	
	vip_offense_escort "Kill the enemy VIP for points.\\r\\n%n points to win."	
	vip_defense_escort "Defend your VIP.\\r\\n%n points to win."	
	
	traits_name_vip_traits "VIP Traits"
	traits_description_vip_traits "Traits applied when a player is the VIP"	
	
	option_escort_zones "Escort VIP?"
	option_description_escort_zones	"VIP can earn points for hitting score zones"
		
	option_kill_points "points for killing a VIP" 
	option_vip_kill_points "points VIP gets for kills"
	option_regular_kill_points "points for killing a normal player"
	option_suicide_points "suicide points"
	
	you_are_vip "YOU ARE THE VIP!"
	
	destination_moved "Destination Moved"
	
end

string_table english
	engine_category_ctf "Capture the Flag"
	engine_category_slayer "Slayer"
	engine_category_oddball "Oddball"
	engine_category_koth "King of the Hill"
	engine_category_juggernaut "Juggernaut"
	engine_category_territories "Territories"
	engine_category_assault "Assault"
	engine_category_infection "Infection"
	engine_category_vip "VIP"
	engine_category_invasion "Invasion"
	engine_category_stockpile "Stockpile"
	engine_category_action_sack "Action Sack"
	engine_category_race "Race"
	engine_category_headhunter "Headhunter"
	engine_category_dogfight "Dogfight"
	engine_category_insane "Insane"
	engine_category_wip "WIP (DO NOT TEST OR SHIP)"
	engine_category_bungie "Bungie"
	engine_category_ms343 "343 Industries"
	engine_category_heroic "Heroic"
	engine_category_legendary "Legendary"
	engine_category_mythic "Mythic"
	engine_category_mantis "mantis"
	engine_category_shishka "Shishka"
	engine_category_huevos "Huevos"
	engine_category_jonnyo "JonnyOThan"
	engine_category_dangerboy "Danger Boy"
	
	engine_category_holiday "Holiday"
	engine_category_community "Community"
	engine_category_matchmaking "Matchmaking"
	
	engine_category_pre_game_warm_up "Pre-Game"
end



;************
;* STRINGS  *
;************

include "strings/common_strings.txt"
include "strings/vip_strings.txt"
include "strings/engine_category_strings.txt"


;**********
;* ENGINE *
;**********

include "includes/engine_icons.txt"

engine_data
	name engine_name
	description engine_description
	icon k_engine_icon_vip
	category vip
end

;***************;
;* MAP OBJECTS *;
;***************;

map_object vip_stuff
	label "vip"
end

map_object escort_zone_object
	label "vip_escort_zone"
end

;****************
;* GAME OPTIONS *
;****************

game_options
	override score_to_win_round 25
	override round_time_limit 10
	override teams_enabled true

	override base_player_traits
		initial_equipment sprint_equipment
		initial_grenades 2 frag
		initial_primary_weapon assault_rifle
	end

	player_traits vip_traits traits_name_vip_traits traits_description_vip_traits
		weapon_pickup 0
		vehicle_usage passenger
		shield_multiplier 200
	end

	option escort_zones
		option_escort_zones
		option_description_escort_zones
		1
		0 option_disabled ""
		1 option_enabled ""
	end

	ranged_option kill_points option_kill_points  ""
		1 0 250
	end

	ranged_option vip_kill_points option_vip_kill_points ""
		1 0 250
	end

	ranged_option regular_kill_points option_regular_kill_points  ""
		0 0 250
	end

	ranged_option suicide_points option_suicide_points ""
		-1 -10 10
	end

end


;*************
;* VARIABLES *
;*************

variables global
	networked object the_hill none
	local number teams_in_hill 0
	local team temp_team none
	local team last_controlling_team none
	networked number desired_hill_index 0
	local number temp_hill_index 0
	local number temp_delta 0
	local number last_hill 0
end

variables team
	networked player vip none
	networked player next_vip none
	local number is_in_hill 0
end

variables player
	networked number been_vip 0
	networked number charity 0
	networked number is_vip 0
end

;************
;* WIDGETS  *
;************

hud_widgets
	attacker_widget top_left
	defender_widget top_left
end


;************
;* TRIGGERS *
;************

trigger initialization
	action for_each player
		action play_sound player current_player vip
		action player_set_objective current_player vip_offense score_to_win_round
	end

	action for_each general
		condition if escort_zones equal_to 1
		action set teams_in_hill set_to 0
		action set last_controlling_team set_to the_hill.team
		action set the_hill.team set_to neutral
	end


end

; pick a vip for each team if they don't have one.
trigger team
	condition team_is_active current_team
	condition if current_team.vip equal_to none

	action for_each random_player
		condition if current_player.team equal_to current_team

		action set current_team.vip set_to current_player
		action set current_player.been_vip add 1
		action hud_post_message player current_player none you_are_vip
		action play_sound everyone new_vip
	end
end

; apply vip traits
trigger  player
	action navpoint_set_visible current_player no_one

	condition if current_player equal_to attackers.vip or
	condition if current_player equal_to defenders.vip

	action navpoint_set_visible current_player everyone
	action navpoint_set_icon current_player vip
	action navpoint_set_priority current_player normal

	action apply_player_traits current_player vip_traits
end

; vip scoring
trigger player
	temporary player old_vip_attacker attackers.vip
	temporary player old_vip_defender defenders.vip
	temporary player killing_player none
	temporary player dead_player current_player

	condition player_died current_player any

	action player_death_get_killing_player current_player killing_player

	temporary team victim_team current_player.team
	temporary team killer_team killing_player.team

;	condition not if killing_player equal_to none

	; suicide?
	action for_each general
		condition not player_died current_player enemy
		condition not player_died current_player betrayal
		action set_score add suicide_points player current_player
	end

	; VIP suicide?
	action for_each general
		condition not player_died current_player enemy
		condition not player_died current_player betrayal
		condition if current_player equal_to old_vip_attacker or
		condition if current_player equal_to old_vip_defender
		action set_score add suicide_points player current_player
		action play_sound everyone vip_killed
		action set victim_team.vip set_to none
	end

	; killed by a vip?
	action for_each general
		condition player_died current_player enemy
		condition if killing_player equal_to old_vip_attacker or
		condition if killing_player equal_to old_vip_defender
		action set_score add vip_kill_points player killing_player
	end

	; killed a vip?
	action for_each general
		condition player_died current_player enemy
		condition if current_player equal_to old_vip_attacker or
		condition if current_player equal_to old_vip_defender
		action set_score add kill_points player killing_player
		action play_sound everyone vip_killed
		action set victim_team.vip set_to none
	end

	; killed a regular dude?
	action for_each general
		condition player_died current_player enemy
		condition not if current_player equal_to old_vip_attacker or
		condition not if current_player equal_to old_vip_defender
		action set_score add regular_kill_points player killing_player
	end
end



; ESCORT STUFF

trigger general
	condition if escort_zones equal_to 1

	condition if the_hill equal_to none

	action for_each general
		action navpoint_set_visible the_hill no_one
		action boundary_set_visible the_hill no_one
		action set the_hill set_to none

		; count the number of hill objects
		action set temp_hill_index set_to 0

		action for_each escort_zone_object
			action set temp_hill_index add 1
		end

		action set desired_hill_index add 1
		condition if desired_hill_index greater_than temp_hill_index
		action set desired_hill_index set_to 0
	end
end

trigger general
	condition if escort_zones equal_to 1
	condition if the_hill equal_to none

	action set temp_hill_index set_to -1

	action for_each escort_zone_object
		condition if the_hill equal_to none

		action set temp_hill_index add 1

		condition if temp_hill_index equal_to desired_hill_index

		action set the_hill set_to current_object
		action set the_hill.team set_to neutral
		action navpoint_set_visible the_hill everyone
		action navpoint_set_icon the_hill destination
		action boundary_set_visible the_hill everyone
		action navpoint_set_priority the_hill high

		action set last_hill set_to desired_hill_index
	end

	; still no hill? revert to 0
	condition if the_hill equal_to none
	action set desired_hill_index set_to 0
end


; figure out which teams have players in the hill
trigger player
	condition player_is_active current_player
	condition if escort_zones equal_to 1

	condition not if the_hill equal_to none
	condition object_in_area current_player the_hill

	condition if current_player equal_to attackers.vip or
	condition if current_player equal_to defenders.vip

	action set_score add 1 team current_player.team
	action hud_post_message everyone destination_moved destination_moved

	action navpoint_set_visible the_hill no_one
	action boundary_set_visible the_hill no_one

	action set the_hill set_to none
end


;end the round when time runs out!
trigger general
	condition timer_expired round_timer
	action end_round
end
`;
