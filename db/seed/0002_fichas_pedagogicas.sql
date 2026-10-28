-- =====================================================================
-- Fichas pedagógicas originais — Equipe CineMente
-- Referências citadas: apenas obras clássicas e amplamente conhecidas.
-- BNCC: deixado vazio de propósito até verificação por especialista.
-- =====================================================================

drop table if exists _fichas;
create temporary table _fichas (
  slug text, why_use text, concepts text[], thinkers text[], objectives text[],
  debate text[], plan jsonb, activities jsonb, analysis jsonb, tips text[], refs text[]
);

insert into _fichas values
-- O SHOW DE TRUMAN ------------------------------------------------------
('o-show-de-truman',
 $$Uma porta de entrada acessível para a alegoria da caverna e para a discussão sobre mídia, espetáculo e vigilância. Os alunos reconhecem o próprio cotidiano de câmeras e redes sociais na história de Truman.$$,
 '{Alegoria da caverna,Aparência e realidade,Sociedade do espetáculo,Vigilância,Liberdade}',
 '{Platão,Guy Debord,Michel Foucault}',
 '{"Relacionar a trajetória de Truman à alegoria da caverna de Platão","Identificar mecanismos de controle e vigilância representados no filme","Discutir o papel da mídia na construção da percepção da realidade"}',
 '{"Truman era feliz antes de descobrir a verdade? A felicidade baseada em uma ilusão tem valor?","Christof afirma proteger Truman do mundo real. Isso justifica a manipulação?","Quem é mais responsável: o criador do programa ou o público que assiste?","Em que aspectos a nossa vida nas redes sociais se parece com a de Truman?"}',
 '[{"etapa":"Sensibilização","tempo":"10 min","descricao":"Pergunte à turma: como saberíamos se tudo ao nosso redor fosse encenado? Registre as respostas no quadro."},{"etapa":"Exibição","tempo":"103 min (ou trechos)","descricao":"Exiba o filme completo ou a sequência inicial e o desfecho, se o tempo for curto."},{"etapa":"Leitura de apoio","tempo":"20 min","descricao":"Leitura comentada de trecho da alegoria da caverna (A República, livro VII)."},{"etapa":"Debate","tempo":"25 min","descricao":"Use as perguntas de debate em roda, relacionando cada etapa da saída da caverna a momentos do filme."},{"etapa":"Síntese","tempo":"10 min","descricao":"Cada aluno escreve, em três linhas, o que seria a sua caverna hoje."}]',
 '[{"nome":"Mapa da caverna","descricao":"Em grupos, os alunos montam um quadro comparando elementos da alegoria (sombras, correntes, saída, sol) com cenas do filme."},{"nome":"Diário de vigilância","descricao":"Durante um dia, cada aluno anota quantas vezes foi registrado por câmeras, aplicativos ou redes. Discussão na aula seguinte."}]',
 '[{"momento":"Primeiros minutos","observar":"Enquadramentos que imitam câmeras escondidas e o efeito disso sobre o espectador."},{"momento":"O refletor que cai do céu","observar":"A primeira fissura no cenário: o início da dúvida."},{"momento":"A travessia de barco","observar":"O medo como mecanismo de controle."},{"momento":"A porta no horizonte","observar":"A escolha final e o sentido da liberdade."}]',
 '{"Com turmas do 1º ano, foque na comparação com a caverna antes de introduzir Debord.","Com turmas mais avançadas, aprofunde a ideia de panoptismo em Foucault."}',
 '{"PLATÃO. A República, livro VII.","DEBORD, Guy. A sociedade do espetáculo.","FOUCAULT, Michel. Vigiar e punir."}'),

-- TEMPOS MODERNOS ---------------------------------------------------------
('tempos-modernos',
 $$Um clássico sem diálogos falados na maior parte do tempo, ideal para discutir trabalho industrial, alienação e desemprego com qualquer turma. O humor físico de Chaplin prende a atenção e abre espaço para análise crítica.$$,
 '{Alienação do trabalho,Taylorismo e fordismo,Divisão do trabalho,Desemprego,Racionalização}',
 '{Karl Marx,Max Weber}',
 '{"Compreender o conceito de alienação do trabalho em Marx","Identificar características da produção em série","Relacionar a crise retratada no filme a transformações atuais do mundo do trabalho"}',
 '{"Por que o operário continua apertando parafusos mesmo fora da fábrica?","O que a máquina de alimentação revela sobre a relação entre empresa e trabalhador?","A tecnologia liberta ou aprisiona quem trabalha?","Que semelhanças existem entre a linha de montagem e o trabalho por aplicativos?"}',
 '[{"etapa":"Problematização","tempo":"10 min","descricao":"Mostre a imagem de uma linha de montagem atual e pergunte: o que mudou desde o início do século XX?"},{"etapa":"Exibição","tempo":"87 min (ou trechos)","descricao":"Exiba o filme completo ou as sequências da fábrica e da máquina de alimentação."},{"etapa":"Conceito","tempo":"20 min","descricao":"Apresente as quatro dimensões da alienação: em relação ao produto, ao processo, a si mesmo e aos outros."},{"etapa":"Debate","tempo":"20 min","descricao":"Perguntas de debate em grupos, com registro em cartaz."}]',
 '[{"nome":"Ontem e hoje","descricao":"Os alunos entrevistam um familiar sobre sua rotina de trabalho e comparam com as cenas do filme."},{"nome":"Linha de montagem","descricao":"Dinâmica em sala: produção em série de dobraduras com tarefas fragmentadas, seguida de discussão sobre a experiência."}]',
 '[{"momento":"Abertura","observar":"A montagem que aproxima trabalhadores e um rebanho de ovelhas."},{"momento":"A linha de montagem","observar":"O ritmo imposto pela máquina sobre o corpo."},{"momento":"A máquina de alimentação","observar":"A tentativa de eliminar qualquer tempo improdutivo."},{"momento":"O final na estrada","observar":"A esperança possível fora da engrenagem."}]',
 '{"Por ser majoritariamente sem diálogos, o filme funciona bem com turmas que têm dificuldade com legendas.","Para o Ensino Médio, conecte com a discussão sobre plataformização do trabalho."}',
 '{"MARX, Karl. Manuscritos econômico-filosóficos.","WEBER, Max. A ética protestante e o espírito do capitalismo."}'),

-- SOCIEDADE DOS POETAS MORTOS -------------------------------------------
('sociedade-dos-poetas-mortos',
 $$Um filme sobre educação, autonomia e o preço de pensar diferente. Funciona para discutir o esclarecimento kantiano, a tensão entre tradição e liberdade e o próprio papel da escola.$$,
 '{Autonomia,Esclarecimento,Tradição e autoridade,Carpe diem,Desobediência}',
 '{Immanuel Kant,Henry David Thoreau,Horácio}',
 '{"Discutir o conceito de esclarecimento como saída da menoridade","Analisar a relação entre autoridade, tradição e liberdade individual","Refletir sobre os limites e responsabilidades da autonomia"}',
 '{"O professor Keating incentiva a autonomia ou impõe a sua própria visão aos alunos?","Pensar por conta própria é sempre seguro? Quem paga o preço?","Qual o papel da escola: transmitir tradição ou formar pensamento crítico?","O que significa, hoje, aproveitar o dia?"}',
 '[{"etapa":"Abertura","tempo":"10 min","descricao":"Pergunta disparadora: alguém já decidiu algo importante por você?"},{"etapa":"Exibição","tempo":"128 min (ou trechos)","descricao":"Exiba o filme ou as cenas da primeira aula, da caverna e do desfecho."},{"etapa":"Texto","tempo":"25 min","descricao":"Leitura do início de Resposta à pergunta: o que é o Esclarecimento?, de Kant."},{"etapa":"Debate","tempo":"25 min","descricao":"Debate guiado pelas perguntas, relacionando cada personagem à ideia de menoridade."}]',
 '[{"nome":"Carta a si mesmo","descricao":"Cada aluno escreve uma carta sobre uma escolha que gostaria de fazer com mais autonomia."},{"nome":"Júri dos personagens","descricao":"Grupos defendem ou acusam Keating, o diretor da escola e o pai de Neil."}]',
 '[{"momento":"A primeira aula","observar":"As fotografias dos antigos alunos e o convite ao carpe diem."},{"momento":"Subir na mesa","observar":"Mudar o ponto de vista como gesto filosófico."},{"momento":"A peça de teatro","observar":"O conflito entre desejo pessoal e expectativa familiar."},{"momento":"O desfecho","observar":"O gesto coletivo dos alunos e seu significado."}]',
 '{"O filme aborda suicídio. Prepare a turma, avise com antecedência e tenha à mão informações sobre o CVV (188).","Prefira exibir trechos com turmas mais jovens."}',
 '{"KANT, Immanuel. Resposta à pergunta: o que é o Esclarecimento?","THOREAU, Henry David. Walden."}'),

-- A ONDA ----------------------------------------------------------------
('a-onda',
 $$Mostra, em ritmo de suspense, como mecanismos autoritários podem surgir rapidamente em um grupo comum. Excelente para tratar de totalitarismo, conformidade e responsabilidade individual.$$,
 '{Autocracia,Totalitarismo,Conformidade social,Identidade de grupo,Responsabilidade}',
 '{Hannah Arendt,Max Weber}',
 '{"Compreender características de regimes autoritários","Identificar mecanismos de pressão de grupo e exclusão","Discutir a responsabilidade individual diante de movimentos coletivos"}',
 '{"Por que os alunos aderem tão rápido ao movimento?","Que símbolos e regras fortaleceram o grupo? Que preço tiveram?","Quem é responsável pelo desfecho: o professor, os alunos ou a escola?","Poderia acontecer algo parecido na nossa escola?"}',
 '[{"etapa":"Pergunta inicial","tempo":"10 min","descricao":"A turma responde anonimamente: uma ditadura poderia surgir hoje no Brasil?"},{"etapa":"Exibição","tempo":"107 min","descricao":"Exibição do filme."},{"etapa":"Conceito","tempo":"20 min","descricao":"Apresente traços do totalitarismo segundo Arendt: ideologia, terror, massa e isolamento."},{"etapa":"Debate","tempo":"25 min","descricao":"Retome as respostas anônimas iniciais e compare com o que o filme mostrou."}]',
 '[{"nome":"Linha do tempo da Onda","descricao":"Grupos reconstroem dia a dia a escalada do movimento, apontando o momento em que o experimento perdeu o controle."},{"nome":"Contra-argumentos","descricao":"Cada aluno escreve o que diria à turma no terceiro dia para interromper o movimento."}]',
 '[{"momento":"A escolha do tema","observar":"A crença inicial de que a autocracia é coisa do passado."},{"momento":"Uniforme e saudação","observar":"Símbolos que criam pertencimento e exclusão."},{"momento":"Os que recusam","observar":"Como o grupo trata quem não adere."},{"momento":"O discurso final","observar":"A virada e a reação dos alunos."}]',
 '{"O filme tem cenas de violência no desfecho; avalie a faixa etária da turma.","Evite reproduzir o experimento em sala: discuta-o."}',
 '{"ARENDT, Hannah. Origens do totalitarismo.","ARENDT, Hannah. Eichmann em Jerusalém."}'),

-- MATRIX ----------------------------------------------------------------
('matrix',
 $$Uma das formas mais eficazes de apresentar problemas clássicos da teoria do conhecimento: como sei que o mundo é real? Conecta Platão, Descartes e Baudrillard com uma linguagem que os alunos conhecem.$$,
 '{Aparência e realidade,Dúvida metódica,Simulacro,Livre-arbítrio,Conhecimento}',
 '{Platão,René Descartes,Jean Baudrillard}',
 '{"Relacionar a narrativa ao argumento do sonho e do gênio maligno de Descartes","Comparar a saída da Matrix com a saída da caverna","Introduzir o conceito de simulacro"}',
 '{"Se a experiência for idêntica, importa se o mundo é real?","Você tomaria a pílula vermelha ou a azul? Por quê?","Cypher prefere voltar à ilusão. Ele está errado?","Quais seriam as Matrix do nosso tempo?"}',
 '[{"etapa":"Experimento mental","tempo":"10 min","descricao":"Pergunte: como provar agora que você não está sonhando?"},{"etapa":"Exibição","tempo":"136 min (ou trechos)","descricao":"Exiba o filme ou as cenas da escolha das pílulas e do despertar."},{"etapa":"Texto","tempo":"20 min","descricao":"Leitura da Primeira Meditação de Descartes."},{"etapa":"Debate","tempo":"25 min","descricao":"Comparação entre Descartes, Platão e o filme em quadro de três colunas."}]',
 '[{"nome":"Três cavernas","descricao":"Os alunos montam um quadro comparativo entre a caverna de Platão, o gênio maligno de Descartes e a Matrix."},{"nome":"Pílula vermelha","descricao":"Texto argumentativo defendendo uma das escolhas com base em pelo menos um filósofo estudado."}]',
 '[{"momento":"O coelho branco","observar":"Referência a Alice e o convite a atravessar a aparência."},{"momento":"As pílulas","observar":"A escolha entre conforto e verdade."},{"momento":"O despertar","observar":"A dor da saída, como na caverna."},{"momento":"O jantar de Cypher","observar":"A defesa da ilusão como escolha consciente."}]',
 '{"Para turmas com menos tempo, a cena das pílulas sozinha já sustenta uma aula.","O filme tem muitas cenas de ação armada; selecione trechos conforme a turma."}',
 '{"PLATÃO. A República, livro VII.","DESCARTES, René. Meditações metafísicas.","BAUDRILLARD, Jean. Simulacros e simulação."}'),

-- O DILEMA DAS REDES ------------------------------------------------------
('o-dilema-das-redes',
 $$Documentário próximo da realidade dos alunos, que permite discutir economia da atenção, uso de dados e efeitos das redes na sociedade. Funciona como ponto de partida para pensamento crítico sobre tecnologia.$$,
 '{Economia da atenção,Capitalismo de vigilância,Algoritmos,Polarização,Modernidade líquida}',
 '{Shoshana Zuboff,Zygmunt Bauman}',
 '{"Compreender como plataformas digitais lucram com atenção e dados","Analisar efeitos sociais e políticos dos algoritmos","Desenvolver postura crítica em relação ao próprio uso das redes"}',
 '{"Se o serviço é gratuito, o que estamos pagando?","Os algoritmos apenas mostram o que queremos ou moldam o que queremos?","De quem é a responsabilidade: das empresas, dos governos ou dos usuários?","O documentário exagera em algum ponto? Que argumentos faltaram?"}',
 '[{"etapa":"Levantamento","tempo":"10 min","descricao":"Os alunos verificam o tempo de tela semanal no próprio celular (opcional e anônimo)."},{"etapa":"Exibição","tempo":"94 min","descricao":"Exibição do documentário."},{"etapa":"Conceito","tempo":"20 min","descricao":"Explique a ideia de capitalismo de vigilância e de economia da atenção."},{"etapa":"Debate crítico","tempo":"25 min","descricao":"Debate, incluindo a pergunta sobre o que o documentário deixou de fora."}]',
 '[{"nome":"Auditoria do feed","descricao":"Cada aluno analisa as 20 primeiras publicações do seu feed e classifica o que é anúncio, entretenimento, notícia e opinião."},{"nome":"Contrapontos","descricao":"Pesquisa de críticas ao documentário e produção de um parágrafo avaliando seus argumentos."}]',
 '[{"momento":"Entrevistas iniciais","observar":"Quem são os entrevistados e de onde falam."},{"momento":"A dramatização da família","observar":"O recurso ficcional como estratégia de convencimento."},{"momento":"Os algoritmos personificados","observar":"Como o filme torna visível o invisível."},{"momento":"Encerramento","observar":"As soluções propostas e seus limites."}]',
 '{"Trabalhe também a leitura crítica do próprio documentário: ele também quer convencer.","Evite tom moralista sobre o uso de celular; foque na estrutura econômica."}',
 '{"ZUBOFF, Shoshana. A era do capitalismo de vigilância.","BAUMAN, Zygmunt. Modernidade líquida."}'),

-- 12 HOMENS E UMA SENTENÇA -----------------------------------------------
('12-homens-e-uma-sentenca',
 $$Uma aula de argumentação em uma única sala. Permite trabalhar justiça, preconceito, dúvida razoável e a força do diálogo, além de lógica e falácias.$$,
 '{Justiça,Argumentação,Falácias,Preconceito,Dúvida razoável,Deliberação}',
 '{Sócrates,Platão,Hannah Arendt}',
 '{"Identificar argumentos, premissas e falácias nas falas dos jurados","Discutir a relação entre justiça, preconceito e opinião","Valorizar o diálogo racional como forma de decisão coletiva"}',
 '{"O jurado nº 8 sabe que o réu é inocente? O que ele realmente defende?","Que preconceitos influenciam o voto de cada jurado?","Unanimidade garante justiça?","Que semelhanças há entre o jurado nº 8 e Sócrates?"}',
 '[{"etapa":"Situação-problema","tempo":"10 min","descricao":"Apresente um caso simples e peça um veredito rápido da turma."},{"etapa":"Exibição","tempo":"96 min","descricao":"Exibição do filme."},{"etapa":"Análise","tempo":"25 min","descricao":"Grupos mapeiam argumentos e falácias de três jurados diferentes."},{"etapa":"Retomada","tempo":"15 min","descricao":"Volte ao caso inicial: a turma mudaria seu veredito com mais tempo de discussão?"}]',
 '[{"nome":"Caça às falácias","descricao":"Lista de falácias (ad hominem, apelo à emoção, generalização) para identificar nas falas do filme."},{"nome":"Júri simulado","descricao":"A turma delibera sobre um caso fictício seguindo regras de argumentação."}]',
 '[{"momento":"A primeira votação","observar":"A pressão da maioria e o voto isolado."},{"momento":"O canivete","observar":"A prova que parecia definitiva."},{"momento":"O discurso preconceituoso","observar":"A reação silenciosa dos outros jurados."},{"momento":"A última votação","observar":"O que realmente mudou na sala."}]',
 '{"O filme é em preto e branco e tem ritmo de teatro; contextualize antes da exibição.","Ótimo para avaliar argumentação escrita em seguida."}',
 '{"PLATÃO. Apologia de Sócrates.","ARENDT, Hannah. Verdade e política (em Entre o passado e o futuro)."}'),

-- A VIDA É BELA ---------------------------------------------------------
('a-vida-e-bela',
 $$Une humor e tragédia para tratar do Holocausto, da dignidade humana e da proteção da infância. Abre espaço para discutir memória histórica, direitos humanos e o sentido da vida diante do horror.$$,
 '{Dignidade humana,Holocausto,Memória,Banalidade do mal,Esperança}',
 '{Hannah Arendt,Primo Levi,Viktor Frankl}',
 '{"Contextualizar o Holocausto e a perseguição aos judeus na Segunda Guerra","Discutir a dignidade humana como fundamento dos direitos humanos","Refletir sobre os limites do humor diante da tragédia"}',
 '{"É legítimo usar humor para falar do Holocausto?","Guido mente para o filho. Essa mentira é moralmente justificável?","O que o filme nos diz sobre resistir quando não há saída?","Por que é importante preservar a memória desses acontecimentos?"}',
 '[{"etapa":"Contexto","tempo":"15 min","descricao":"Breve exposição sobre o fascismo italiano, as leis raciais e os campos de concentração."},{"etapa":"Exibição","tempo":"116 min","descricao":"Exibição do filme."},{"etapa":"Leitura","tempo":"20 min","descricao":"Leitura da Declaração Universal dos Direitos Humanos (artigos 1 a 5)."},{"etapa":"Debate","tempo":"25 min","descricao":"Debate com as perguntas propostas."}]',
 '[{"nome":"Carta de Giosuè","descricao":"Os alunos escrevem uma carta do filho, já adulto, sobre o que o pai fez por ele."},{"nome":"Memória viva","descricao":"Pesquisa sobre testemunhos de sobreviventes e museus do Holocausto."}]',
 '[{"momento":"Primeira parte","observar":"O tom de comédia romântica e os sinais do fascismo ao fundo."},{"momento":"O cavalo pintado","observar":"O antissemitismo entrando na vida privada."},{"momento":"A tradução das regras","observar":"O humor como escudo para a criança."},{"momento":"O desfecho","observar":"O sentido do título."}]',
 '{"Contextualize historicamente antes da exibição.","Esteja atento a alunos com histórias familiares ligadas a perseguições e guerras."}',
 '{"LEVI, Primo. É isto um homem?","FRANKL, Viktor. Em busca de sentido.","ARENDT, Hannah. Eichmann em Jerusalém.","ONU. Declaração Universal dos Direitos Humanos (1948)."}');

insert into pedagogical_guides (title_id, why_use, concepts, thinkers, objectives, debate_questions, lesson_plan, activities, analysis_script, approach_tips, references_list)
select t.id, f.why_use, f.concepts, f.thinkers, f.objectives, f.debate, f.plan, f.activities, f.analysis, f.tips, f.refs
from _fichas f join titles t on t.slug = f.slug
on conflict (title_id) do update set
  why_use = excluded.why_use, concepts = excluded.concepts, thinkers = excluded.thinkers,
  objectives = excluded.objectives, debate_questions = excluded.debate_questions,
  lesson_plan = excluded.lesson_plan, activities = excluded.activities,
  analysis_script = excluded.analysis_script, approach_tips = excluded.approach_tips,
  references_list = excluded.references_list, updated_at = now();

drop table if exists _fichas;
