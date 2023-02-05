import * as Util from '#src/modules/util.js';
import { client } from '#src/index.js';
import { ButtonStyle, ComponentType } from 'discord.js';

class Command {

  createEmbed({}){
     
  
    const contents = {
      

	 
    };

    
    const description = "тут пока что пусто"
    const fields = [
      {
        
        
      },
      {
        
        
      }
    ]
    

    const embed = {
      description,
      fields, 
      footer: {text: member.tag, iconURL: member.avatarURL()}
    }

    return embed;
  }
  
  async onChatInput(msg, interaction){
	const member = interaction.mention ?? msg.author;

	const guild = msg.guild;
	
	  msg.msg({description:"hhh"});
	  return;
	};

	options = {
		"name": "clan",
		"id": 62,
		"media": {
		  "description": "пока тут пусто"
		},
		"allias": "клан",
		 "type": "other"
  };
};
	

export default Command;
