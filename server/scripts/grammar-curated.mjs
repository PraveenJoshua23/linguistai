/**
 * Hand-authored grammar topics that override LLM generation.
 *
 * The model (gpt-oss-120b) cannot reliably track Korean 받침 (whether a noun
 * ends in a consonant or vowel), which particle selection depends on, and it
 * tends to pre-attach the tested particle to the noun while adding a stray
 * blank. Particle rules are fully deterministic, so these foundational topics
 * are authored by hand for correctness. Keyed by language id, then topic id;
 * the generator splices these in over whatever the model produced.
 */
export const CURATED = {
  korean: {
    'topic-particle': {
      summary: 'The topic particle 은/는 marks what a sentence is about — use 은 after a consonant and 는 after a vowel.',
      explanation:
        '은/는 marks the topic, the thing the sentence is commenting on, often with a sense of contrast. Attach 은 to a noun ending in a consonant and 는 to a noun ending in a vowel. It differs from the subject particle 이/가, which simply marks the grammatical subject.',
      examples: [
        { text: '저는 학생이에요.', romanization: 'jeoneun haksaeng-ieyo.', translation: 'I am a student.' },
        { text: '책은 책상 위에 있어요.', romanization: 'chaegeun chaeksang wie isseoyo.', translation: 'The book is on the desk.' },
        { text: '오늘은 날씨가 좋아요.', romanization: 'oneureun nalssiga joayo.', translation: 'Today the weather is nice.' },
      ],
      exercises: [
        { prompt: '저___ 한국 사람이에요.', promptTranslation: 'I am Korean.', options: ['은', '는', '이', '가'], answerIndex: 1, explanation: '저 ends in a vowel, so the topic particle 는 is used.' },
        { prompt: '동생___ 키가 커요.', promptTranslation: 'My younger sibling is tall.', options: ['은', '는', '이', '가'], answerIndex: 0, explanation: '동생 ends in a consonant, so 은 is used.' },
        { prompt: '커피___ 맛있어요.', promptTranslation: 'The coffee is delicious.', options: ['은', '는', '이', '가'], answerIndex: 1, explanation: '커피 ends in a vowel, so 는 is used.' },
        { prompt: '산___ 높아요.', promptTranslation: 'The mountain is high.', options: ['은', '는', '이', '가'], answerIndex: 0, explanation: '산 ends in a consonant, so 은 is used.' },
      ],
    },
    'subject-particle': {
      summary: 'The subject particle 이/가 marks the grammatical subject — use 이 after a consonant and 가 after a vowel.',
      explanation:
        '이/가 marks the subject that performs the action or is described. Attach 이 to a noun ending in a consonant and 가 to a noun ending in a vowel. Compared with 은/는, 이/가 often introduces new or specific information.',
      examples: [
        { text: '친구가 왔어요.', romanization: 'chinguga wasseoyo.', translation: 'A friend came.' },
        { text: '책이 책상 위에 있어요.', romanization: 'chaegi chaeksang wie isseoyo.', translation: 'The book is on the desk.' },
        { text: '날씨가 좋아요.', romanization: 'nalssiga joayo.', translation: 'The weather is nice.' },
      ],
      exercises: [
        { prompt: '학생___ 도서관에 있어요.', promptTranslation: 'A student is in the library.', options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '학생 ends in a consonant, so 이 is used.' },
        { prompt: '바람___ 불어요.', promptTranslation: 'The wind is blowing.', options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '바람 ends in a consonant, so 이 is used.' },
        { prompt: '아이___ 자고 있어요.', promptTranslation: 'The child is sleeping.', options: ['이', '가', '은', '는'], answerIndex: 1, explanation: '아이 ends in a vowel, so 가 is used.' },
        { prompt: '시간___ 없어요.', promptTranslation: "There is no time.", options: ['이', '가', '은', '는'], answerIndex: 0, explanation: '시간 ends in a consonant, so 이 is used.' },
      ],
    },
    'object-particle': {
      summary: 'The object particle 을/를 marks the direct object — use 을 after a consonant and 를 after a vowel.',
      explanation:
        '을/를 marks the direct object, the thing the action is done to. Attach 을 to a noun ending in a consonant and 를 to a noun ending in a vowel.',
      examples: [
        { text: '사과를 먹어요.', romanization: 'sagwareul meogeoyo.', translation: 'I eat an apple.' },
        { text: '책을 읽어요.', romanization: 'chaegeul ilgeoyo.', translation: 'I read a book.' },
        { text: '물을 마셔요.', romanization: 'mureul masyeoyo.', translation: 'I drink water.' },
      ],
      exercises: [
        { prompt: '영화___ 봐요.', promptTranslation: 'I watch a movie.', options: ['을', '를', '이', '가'], answerIndex: 1, explanation: '영화 ends in a vowel, so 를 is used.' },
        { prompt: '밥___ 먹어요.', promptTranslation: 'I eat (a meal).', options: ['을', '를', '이', '가'], answerIndex: 0, explanation: '밥 ends in a consonant, so 을 is used.' },
        { prompt: '커피___ 마셔요.', promptTranslation: 'I drink coffee.', options: ['을', '를', '이', '가'], answerIndex: 1, explanation: '커피 ends in a vowel, so 를 is used.' },
        { prompt: '음식___ 만들어요.', promptTranslation: 'I make food.', options: ['을', '를', '이', '가'], answerIndex: 0, explanation: '음식 ends in a consonant, so 을 is used.' },
      ],
    },
    'present-tense': {
      summary: 'Polite present tense adds -아요 to ㅏ/ㅗ stems, -어요 to other stems, and -해요 to 하다 verbs.',
      explanation:
        'To make the polite present tense, attach -아요 to verb stems whose last vowel is ㅏ or ㅗ, and -어요 to other stems. Verbs ending in 하다 become 해요. For example 가다 → 가요, 먹다 → 먹어요, 공부하다 → 공부해요.',
      examples: [
        { text: '저는 매일 운동해요.', romanization: 'jeoneun maeil undonghaeyo.', translation: 'I exercise every day.' },
        { text: '친구가 책을 읽어요.', romanization: 'chinguga chaegeul ilgeoyo.', translation: 'My friend reads a book.' },
        { text: '우리는 물을 마셔요.', romanization: 'urineun mureul masyeoyo.', translation: 'We drink water.' },
      ],
      exercises: [
        { prompt: '저는 학교에 ___ . (가다)', promptTranslation: 'I go to school.', options: ['가요', '가아요', '거요', '갸요'], answerIndex: 0, explanation: '가다 has the vowel ㅏ, so it becomes 가요.' },
        { prompt: '동생이 밥을 ___ . (먹다)', promptTranslation: 'My sibling eats.', options: ['먹어요', '먹아요', '머거요', '먹요'], answerIndex: 0, explanation: '먹다 has no ㅏ/ㅗ, so it takes -어요 → 먹어요.' },
        { prompt: '우리는 한국어를 ___ . (공부하다)', promptTranslation: 'We study Korean.', options: ['공부해요', '공부하요', '공부어요', '공부아요'], answerIndex: 0, explanation: '하다 verbs become 해요, so 공부하다 → 공부해요.' },
        { prompt: '그 사람은 커피를 ___ . (마시다)', promptTranslation: 'That person drinks coffee.', options: ['마셔요', '마시어요', '마시아요', '마시요'], answerIndex: 0, explanation: '마시다 + -어요 contracts to 마셔요.' },
      ],
    },
    'negation': {
      summary: 'Negate a verb with 안 before it, or by attaching -지 않다 to the stem.',
      explanation:
        'There are two ways to negate. Put 안 directly before the verb (안 가요 = "don’t go"), or attach -지 않다 to the verb stem (가지 않아요). Both mean the same thing; 안 is more colloquial.',
      examples: [
        { text: '저는 안 가요.', romanization: 'jeoneun an gayo.', translation: "I don't go." },
        { text: '그녀는 밥을 안 먹어요.', romanization: 'geunyeoneun babeul an meogeoyo.', translation: "She doesn't eat." },
        { text: '친구가 오지 않아요.', romanization: 'chinguga oji anayo.', translation: "My friend doesn't come." },
      ],
      exercises: [
        { prompt: '저는 오늘 ___ 가요.', promptTranslation: "I don't go today.", options: ['안', '못', '잘', '또'], answerIndex: 0, explanation: '안 before the verb makes it negative: 안 가요.' },
        { prompt: '그녀는 고기를 ___ 먹어요.', promptTranslation: "She doesn't eat meat.", options: ['안', '를', '는', '도'], answerIndex: 0, explanation: '안 먹어요 means "doesn’t eat."' },
        { prompt: '친구가 학교에 가지 ___ .', promptTranslation: "My friend doesn't go to school.", options: ['않아요', '못해요', '있어요', '말아요'], answerIndex: 0, explanation: 'The -지 않다 pattern: 가지 않아요.' },
        { prompt: '비가 오지 ___ .', promptTranslation: "It doesn't rain.", options: ['않아요', '없어요', '아니요', '말아요'], answerIndex: 0, explanation: '오지 않아요 means "it doesn’t rain."' },
      ],
    },
    'location-particles': {
      summary: 'Use 에 for a destination or static location, and 에서 for the place where an action happens.',
      explanation:
        '에 marks a destination (가다/오다) or where something exists (있다/없다). 에서 marks the place where an action takes place. So you go 학교에 (to school) but study 학교에서 (at school).',
      examples: [
        { text: '학교에 가요.', romanization: 'hakgyo-e gayo.', translation: 'I go to school.' },
        { text: '도서관에서 공부해요.', romanization: 'doseogwan-eseo gongbuhaeyo.', translation: 'I study at the library.' },
        { text: '집에 있어요.', romanization: 'jibe isseoyo.', translation: 'I am at home.' },
      ],
      exercises: [
        { prompt: '도서관___ 책을 읽어요.', promptTranslation: 'I read a book at the library.', options: ['에', '에서', '은', '는'], answerIndex: 1, explanation: 'Reading is an action, so the place takes 에서.' },
        { prompt: '학교___ 가요.', promptTranslation: 'I go to school.', options: ['에', '에서', '을', '를'], answerIndex: 0, explanation: '가다 takes a destination, so 학교 takes 에.' },
        { prompt: '공원___ 운동해요.', promptTranslation: 'I exercise at the park.', options: ['에', '에서', '은', '는'], answerIndex: 1, explanation: 'Exercising is an action done at the park, so 에서.' },
        { prompt: '집___ 있어요.', promptTranslation: 'I am at home.', options: ['에', '에서', '을', '를'], answerIndex: 0, explanation: '있다 marks a static location with 에.' },
      ],
    },
  },
  japanese: {
    'topic-particle-wa': {
      summary: 'は marks the topic of a sentence — written は but pronounced "wa".',
      explanation:
        'は marks the topic, what the sentence is about. It is written with the hiragana は but pronounced "wa". The basic pattern is "A は B です" (As for A, it is B).',
      examples: [
        { text: '私は学生です。', romanization: 'watashi wa gakusei desu.', translation: 'I am a student.' },
        { text: 'これはペンです。', romanization: 'kore wa pen desu.', translation: 'This is a pen.' },
        { text: '今日は暑いです。', romanization: 'kyō wa atsui desu.', translation: 'Today is hot.' },
      ],
      exercises: [
        { prompt: '彼___先生です。', promptTranslation: 'He is a teacher.', options: ['は', 'が', 'を', 'に'], answerIndex: 0, explanation: 'は marks 彼 as the topic: "As for him, he is a teacher."' },
        { prompt: 'この料理___おいしいです。', promptTranslation: 'This dish is delicious.', options: ['は', 'を', 'に', 'で'], answerIndex: 0, explanation: 'は marks この料理 as the topic.' },
        { prompt: '私の名前___田中です。', promptTranslation: 'My name is Tanaka.', options: ['は', 'が', 'を', 'の'], answerIndex: 0, explanation: 'は marks 名前 as the topic.' },
        { prompt: '日本___四季があります。', promptTranslation: 'Japan has four seasons.', options: ['は', 'を', 'に', 'で'], answerIndex: 0, explanation: 'は sets 日本 as the topic: "In Japan, there are four seasons."' },
      ],
    },
    'subject-particle-ga': {
      summary: 'が marks the grammatical subject, often introducing new or identifying information.',
      explanation:
        'が marks the subject that performs an action or is newly introduced. Use it (rather than は) to answer "who/what" or to point out specific information. Verbs of existence, perception, and ability also take が.',
      examples: [
        { text: '犬が走っています。', romanization: 'inu ga hashitte imasu.', translation: 'A dog is running.' },
        { text: '雨が降っています。', romanization: 'ame ga futte imasu.', translation: 'It is raining.' },
        { text: '私は日本語がわかります。', romanization: 'watashi wa nihongo ga wakarimasu.', translation: 'I understand Japanese.' },
      ],
      exercises: [
        { prompt: '学生___図書館にいます。', promptTranslation: 'A student is in the library.', options: ['が', 'は', 'を', 'に'], answerIndex: 0, explanation: 'が marks 学生 as the subject that exists there.' },
        { prompt: '桜___きれいです。', promptTranslation: 'The cherry blossoms are pretty.', options: ['が', 'を', 'に', 'で'], answerIndex: 0, explanation: 'が marks 桜 as the subject being described.' },
        { prompt: 'だれ___来ましたか。', promptTranslation: 'Who came?', options: ['が', 'は', 'を', 'の'], answerIndex: 0, explanation: 'Question words like だれ take が, not は.' },
        { prompt: '音___聞こえます。', promptTranslation: 'A sound can be heard.', options: ['が', 'を', 'に', 'で'], answerIndex: 0, explanation: 'Perception verbs like 聞こえる take が.' },
      ],
    },
    'object-particle-wo': {
      summary: 'を marks the direct object of a verb, pronounced "o".',
      explanation:
        'を marks the direct object, the thing an action is done to. It is written を but pronounced "o". The pattern is "[object] を [verb]".',
      examples: [
        { text: '手紙を書きます。', romanization: 'tegami o kakimasu.', translation: 'I write a letter.' },
        { text: '音楽を聞きます。', romanization: 'ongaku o kikimasu.', translation: 'I listen to music.' },
        { text: 'お茶を飲みます。', romanization: 'ocha o nomimasu.', translation: 'I drink tea.' },
      ],
      exercises: [
        { prompt: '彼は手紙___書きました。', promptTranslation: 'He wrote a letter.', options: ['を', 'は', 'が', 'に'], answerIndex: 0, explanation: 'を marks 手紙 as the object of 書く.' },
        { prompt: '私は音楽___聞きます。', promptTranslation: 'I listen to music.', options: ['を', 'が', 'に', 'で'], answerIndex: 0, explanation: 'を marks 音楽 as the object of 聞く.' },
        { prompt: '子供がお菓子___食べた。', promptTranslation: 'The child ate sweets.', options: ['を', 'は', 'が', 'の'], answerIndex: 0, explanation: 'を marks お菓子 as the object of 食べる.' },
        { prompt: '毎朝コーヒー___飲みます。', promptTranslation: 'I drink coffee every morning.', options: ['を', 'に', 'で', 'は'], answerIndex: 0, explanation: 'を marks コーヒー as the object of 飲む.' },
      ],
    },
    'particles-ni-de': {
      summary: 'Use に for destinations, time points, and existence; use で for where an action happens.',
      explanation:
        'に marks a destination (東京に行く), a point in time (9時に), or where something exists (机の上に). で marks the place where an action occurs (カフェで食べる) and the means used. Relative time words like 明日 take no particle.',
      examples: [
        { text: '学校に行きます。', romanization: 'gakkō ni ikimasu.', translation: 'I go to school.' },
        { text: 'カフェで昼ごはんを食べます。', romanization: 'kafe de hirugohan o tabemasu.', translation: 'I eat lunch at a cafe.' },
        { text: '9時に始まります。', romanization: 'kuji ni hajimarimasu.', translation: 'It starts at 9 o’clock.' },
      ],
      exercises: [
        { prompt: '駅___待っています。', promptTranslation: 'I am waiting at the station.', options: ['で', 'に', 'を', 'は'], answerIndex: 0, explanation: 'Waiting is an action at the station, so で.' },
        { prompt: '東京___行きます。', promptTranslation: 'I go to Tokyo.', options: ['に', 'で', 'を', 'は'], answerIndex: 0, explanation: 'に marks 東京 as the destination of 行く.' },
        { prompt: '図書館___本を読みます。', promptTranslation: 'I read a book at the library.', options: ['で', 'に', 'を', 'へ'], answerIndex: 0, explanation: 'Reading happens at the library, so で.' },
        { prompt: '7時___起きます。', promptTranslation: 'I get up at 7 o’clock.', options: ['に', 'で', 'を', 'は'], answerIndex: 0, explanation: 'に marks the clock time 7時.' },
      ],
    },
    'possessive-no': {
      summary: 'の links two nouns, showing possession or relationship (A の B = B of A).',
      explanation:
        'の connects nouns: the first noun modifies the second. It shows possession (私の本 = my book), origin, or type (日本語の先生 = Japanese teacher). The pattern is A の B.',
      examples: [
        { text: 'これは私の本です。', romanization: 'kore wa watashi no hon desu.', translation: 'This is my book.' },
        { text: '田中さんの車です。', romanization: 'Tanaka-san no kuruma desu.', translation: 'It is Mr. Tanaka’s car.' },
        { text: '東京の天気はいいです。', romanization: 'Tōkyō no tenki wa ii desu.', translation: 'Tokyo’s weather is good.' },
      ],
      exercises: [
        { prompt: 'これは私___ペンです。', promptTranslation: 'This is my pen.', options: ['の', 'は', 'が', 'を'], answerIndex: 0, explanation: 'の links 私 and ペン: "my pen."' },
        { prompt: '田中さん___車は新しいです。', promptTranslation: "Mr. Tanaka's car is new.", options: ['の', 'を', 'に', 'で'], answerIndex: 0, explanation: 'の shows possession: "Mr. Tanaka’s car."' },
        { prompt: '日本語___先生です。', promptTranslation: 'He is a Japanese teacher.', options: ['の', 'は', 'が', 'を'], answerIndex: 0, explanation: 'の links 日本語 and 先生: "Japanese teacher."' },
        { prompt: '彼___名前は田中です。', promptTranslation: 'His name is Tanaka.', options: ['の', 'が', 'を', 'は'], answerIndex: 0, explanation: 'の shows "his name."' },
      ],
    },
  },
};
