const Groq=require('groq-sdk');

/**
 * Analyse les messages d'un prospect avec un LLM et retourne un score qualifié.
 * @param {Groq} groq - Instance Groq initialisée
 * @param {string[]} prospectMessages - Tableau des messages du prospect
 * @returns {Promise<{score: number, status: string, intention: string, justification: string}>}
 */
async function calculateScoreWithLLM(groq,prospectMessages){
    const conversationText=prospectMessages
        .map((msg,i)=>`Message ${i + 1}:${msg}`)
        .join('\n');
    const systemPrompt=`Tu es un expert en qualification commerciale.
Analyse les messages d'un prospect et évalue son niveau d'intérêt commercial sur une échelle de 0 à 100.

RÈGLES DE SCORING STRICTES :
- Score 70-100 (forte/CHAUDE) : Engagement FERME uniquement
  * "je prends", "je signe", "je confirme", "je veux acheter"
  * "envoyez le contrat", "comment payer", "je suis prêt à commander"
  * Budget + urgence + intention claire SANS hésitation

- Score 35-69 (moyenne/EN_COURS) : Intérêt réel mais pas d'engagement final
  * "je suis intéressé", "ça m'intéresse", "j'aimerais en savoir plus"
  * Budget mentionné mais avec question ("c'est possible ?", "combien ?")
  * Curiosité active avec implication

- Score 0-34 (faible/FERMEE) : Pas d'engagement
  * Simple question "c'est quoi ?", "comment ça marche ?"
  * Désintérêt, objection, "je vais réfléchir"

IMPORTANT :
- "Je suis intéressé" + question = 40-55 (moyenne, pas chaude)
- "Je suis intéressé" + "je prends" + budget = 70+ (chaude)
- Une question comme "c'est possible ?" ou "combien ?" = baisse le score de 10-15 points

Réponds UNIQUEMENT en JSON valide, sans texte autour, format exact :
{
  "score": nombre entre 0 et 100,
  "status": "faible" ou "moyenne" ou "forte",
  "intention": "achat" ou "information" ou "devis" ou "indetermine",
  "justification": "une phrase courte expliquant le score"
}`;
 try{
    const completion=await groq.chat.completions.create({
        model:'llma-3.3-70b-versatile',
        temperature:0.1,
        response_format:{type:"json_object"},
        messages:[
            {role:'system',content:systemPrompt},
            {role:'user',content:conversationText},
        ],
    });
    const raw=completion.chices[0]?.message?.content??'{}';
    const parsed=json.parse(raw);
    const score=Math.min(100,Math.max(0,Math.round(parsed.score ?? 0)));    
    let status;
    if(score>=70){
        status="forte";
    }
    else if(score>=35){
        status="moyenne";
    }
    else{
        status="faible";
    }
    return{
        score,status,
        intention:parsed.intention??"indetermine",
        justification:parsed.justification??"Aucune justification fournie"
    }
 }catch(error){
    console.error("Erreur lors du calcul du score :", error);
    return {score:40, status:"indetermine", intention:"indetermine", justification:"Erreur lors de l'analyse des messages"};
 }

}
/** 
 * Enregistre le score et le statut d'une conversation dans la base de données
 * @param {object} db
 * @param {number} conversationId
 * @param {number} score
 * @param {string} status
*/

async function saveScore(db,conversationId,score,status){
    const [existing]=await db.query(
        `select id from interactions where conversation_id=?`,[conversationId]
    );
    if(existing.length>0){
        await db.query(
            `update interactions set score=? where conversation_id=?`,[score,conversationId]
        );
    }else{
        await db.query(
            `insert into interactions (conversation_id,score,status) values (?,?,?)`,[conversationId,score,status]
        )
    }
     let conversationStatus;
  if (score >= 70) {
    conversationStatus = 'CHAUDE';
  } else if (score >= 35) {
    conversationStatus = 'EN_COURS';
  } else {
    conversationStatus = 'FERMEE';
  }

  await db.query(
    `UPDATE conversations SET statut = ? WHERE id = ?`,
    [conversationStatus, conversationId]
  );

}

module.exports={
    calculateScoreWithLLM,
    saveScore,
};