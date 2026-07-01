export const DEFAULT_SOURCE = `
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
