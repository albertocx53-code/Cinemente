-- =====================================================================
-- CINEMENTE — Catálogo demonstrativo
--
-- Regras seguidas:
--  * Nenhum filme abaixo tem licença de reprodução no CineMente.
--    Por isso NÃO há registros em content_licenses/videos para eles:
--    a plataforma mostra "Onde assistir" e a ficha pedagógica.
--  * Classificação indicativa fica NULL (não verificada) até o
--    administrador conferir no ClassInd e marcar age_rating_verified.
--  * Pôsteres oficiais NÃO são usados: cada título recebe uma arte
--    tipográfica própria do CineMente (coluna art). O admin pode subir
--    pôsteres autorizados depois em poster_url / backdrop_url.
--  * Fichas pedagógicas são texto original da equipe CineMente.
--    Nenhum código da BNCC foi incluído sem verificação.
-- Idempotente: pode ser executado mais de uma vez.
-- =====================================================================

insert into plans (slug, name, description, max_profiles, max_activations)
values ('vitalicio', 'CineMente Vitalício', 'Pagamento único, acesso vitalício ao catálogo e à biblioteca pedagógica.', 3, 1)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Categorias
-- ---------------------------------------------------------------------
insert into categories (slug, name, kind, description) values
  ('filosofia-politica',     'Filosofia política',      'tema', 'Poder, Estado, liberdade e autoridade.'),
  ('etica-e-moral',          'Ética e moral',           'tema', 'Valores, escolhas e responsabilidade.'),
  ('cultura-e-sociedade',    'Cultura e sociedade',     'tema', 'Mídia, consumo, identidade e vida social.'),
  ('trabalho-e-capitalismo', 'Trabalho e capitalismo',  'tema', 'Produção, alienação e tecnologia.'),
  ('direitos-humanos',       'Direitos humanos',        'tema', 'Dignidade, justiça e memória.'),
  ('teoria-do-conhecimento', 'Teoria do conhecimento',  'tema', 'Verdade, aparência e realidade.'),
  ('educacao',               'Educação e autonomia',    'tema', 'Escola, formação e pensamento livre.'),
  ('para-debate',            'Filmes para debates',     'colecao', 'Títulos que rendem discussão em sala.'),
  ('platao',                 'Platão',                  'pensador', null),
  ('descartes',              'René Descartes',          'pensador', null),
  ('kant',                   'Immanuel Kant',           'pensador', null),
  ('marx',                   'Karl Marx',               'pensador', null),
  ('arendt',                 'Hannah Arendt',           'pensador', null),
  ('foucault',               'Michel Foucault',         'pensador', null),
  ('debord',                 'Guy Debord',              'pensador', null),
  ('baudrillard',            'Jean Baudrillard',        'pensador', null),
  ('bauman',                 'Zygmunt Bauman',          'pensador', null),
  ('thoreau',                'Henry David Thoreau',     'pensador', null),
  ('zuboff',                 'Shoshana Zuboff',         'pensador', null),
  ('weber',                  'Max Weber',               'pensador', null),
  ('mito-da-caverna',        'Alegoria da caverna',     'conceito', null),
  ('alienacao',              'Alienação',               'conceito', null),
  ('totalitarismo',          'Totalitarismo',           'conceito', null),
  ('banalidade-do-mal',      'Banalidade do mal',       'conceito', null),
  ('vigilancia',             'Vigilância',              'conceito', null),
  ('duvida-metodica',        'Dúvida metódica',         'conceito', null),
  ('esclarecimento',         'Esclarecimento',          'conceito', null),
  ('justica',                'Justiça',                 'conceito', null)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Títulos (dados factuais conferidos: ano, direção, duração, país)
-- ---------------------------------------------------------------------
insert into titles (slug, type, title, original_title, tagline, synopsis, year, duration_min, country, languages, genres, disciplines, school_levels, art, status, featured, featured_order, popularity, created_at) values
('o-show-de-truman', 'filme', 'O Show de Truman', 'The Truman Show',
 'E se toda a sua vida fosse um cenário?',
 'Truman Burbank leva uma vida comum em uma cidade perfeita, sem saber que tudo à sua volta é um gigantesco estúdio de televisão e que cada momento de sua existência é transmitido ao vivo para o mundo. Quando pequenas falhas começam a aparecer, ele passa a questionar a realidade que sempre conheceu.',
 1998, 103, 'Estados Unidos', '{inglês}', '{Drama,Comédia}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"dome","c1":"#0b1a3a","c2":"#050811","accent":"#e50914","kicker":"Filosofia · Sociologia"}', 'published', true, 1, 98, now() - interval '20 days'),

('tempos-modernos', 'filme', 'Tempos Modernos', 'Modern Times',
 'O homem contra a engrenagem.',
 'Um operário de fábrica é levado ao limite pelo ritmo das linhas de montagem. Entre prisões, empregos perdidos e o encontro com uma jovem órfã, ele atravessa a Grande Depressão tentando sobreviver em um mundo que trata pessoas como peças de máquina.',
 1936, 87, 'Estados Unidos', '{inglês}', '{Comédia,Drama}', '{sociologia,filosofia}', '{"Ensino Fundamental II","Ensino Médio"}',
 '{"motif":"gears","c1":"#2a2a2a","c2":"#0a0a0a","accent":"#d4a017","kicker":"Sociologia"}', 'published', true, 2, 91, now() - interval '18 days'),

('sociedade-dos-poetas-mortos', 'filme', 'Sociedade dos Poetas Mortos', 'Dead Poets Society',
 'Aproveite o dia.',
 'Em um rígido internato masculino dos anos 1950, um professor de literatura incentiva os alunos a pensar por conta própria, a ler poesia com paixão e a questionar o caminho que outros traçaram para eles. A liberdade recém-descoberta, porém, entra em choque com a tradição e a autoridade.',
 1989, 128, 'Estados Unidos', '{inglês}', '{Drama}', '{filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"candle","c1":"#3a1f0b","c2":"#0d0703","accent":"#e8b04b","kicker":"Filosofia"}', 'published', true, 3, 88, now() - interval '16 days'),

('a-onda', 'filme', 'A Onda', 'Die Welle',
 'A autocracia pode acontecer de novo?',
 'Durante uma semana de projetos sobre formas de governo, um professor alemão propõe um experimento prático sobre autocracia. Disciplina, uniforme e um nome comum transformam rapidamente a turma em um movimento coeso — e cada vez mais perigoso.',
 2008, 107, 'Alemanha', '{alemão}', '{Drama,Suspense}', '{sociologia,filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"wave","c1":"#3d0006","c2":"#0a0002","accent":"#ff2a2a","kicker":"Filosofia política"}', 'published', true, 4, 95, now() - interval '14 days'),

('matrix', 'filme', 'Matrix', 'The Matrix',
 'O que é real?',
 'O programador Thomas Anderson leva uma vida dupla como o hacker Neo, até ser contatado por um grupo que revela uma verdade perturbadora: o mundo que ele conhece é uma simulação criada para manter a humanidade sob controle.',
 1999, 136, 'Estados Unidos', '{inglês}', '{Ficção científica,Ação}', '{filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"code","c1":"#022012","c2":"#010805","accent":"#2bd46a","kicker":"Filosofia"}', 'published', false, null, 93, now() - interval '12 days'),

('o-dilema-das-redes', 'documentario', 'O Dilema das Redes', 'The Social Dilemma',
 'Quem está usando quem?',
 'Ex-funcionários de grandes empresas de tecnologia explicam como as redes sociais são projetadas para capturar atenção, coletar dados e influenciar comportamentos, e discutem os efeitos disso sobre a saúde mental, a política e a vida em sociedade.',
 2020, 94, 'Estados Unidos', '{inglês}', '{Documentário}', '{sociologia,filosofia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"nodes","c1":"#14103a","c2":"#05040f","accent":"#ff3d5a","kicker":"Documentário · Sociologia"}', 'published', true, 5, 90, now() - interval '6 days'),

('12-homens-e-uma-sentenca', 'filme', '12 Homens e uma Sentença', '12 Angry Men',
 'Uma dúvida razoável muda tudo.',
 'Doze jurados se reúnem para decidir o destino de um jovem acusado de assassinato. A condenação parece certa, até que um deles se recusa a votar sem antes discutir o caso. Em uma sala abafada, argumentos, preconceitos e convicções são colocados à prova.',
 1957, 96, 'Estados Unidos', '{inglês}', '{Drama}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"table","c1":"#1c1c1c","c2":"#060606","accent":"#e50914","kicker":"Ética · Justiça"}', 'published', false, null, 86, now() - interval '4 days'),

('a-vida-e-bela', 'filme', 'A Vida é Bela', 'La vita è bella',
 'A imaginação como forma de resistência.',
 'Na Itália dos anos 1930, um livreiro judeu conquista a mulher que ama com humor e imaginação. Anos depois, quando ele e o filho são levados a um campo de concentração, ele transforma o horror em um jogo para proteger a criança.',
 1997, 116, 'Itália', '{italiano}', '{Drama,Comédia}', '{filosofia,sociologia}', '{"Ensino Médio","Ensino Superior"}',
 '{"motif":"sun","c1":"#3a0a10","c2":"#0c0204","accent":"#ffb547","kicker":"Direitos humanos"}', 'published', false, null, 84, now() - interval '2 days')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Créditos
-- ---------------------------------------------------------------------
insert into people (slug, name) values
  ('peter-weir','Peter Weir'), ('jim-carrey','Jim Carrey'), ('laura-linney','Laura Linney'), ('ed-harris','Ed Harris'),
  ('charles-chaplin','Charles Chaplin'), ('paulette-goddard','Paulette Goddard'),
  ('robin-williams','Robin Williams'), ('ethan-hawke','Ethan Hawke'),
  ('dennis-gansel','Dennis Gansel'), ('jurgen-vogel','Jürgen Vogel'),
  ('lana-wachowski','Lana Wachowski'), ('lilly-wachowski','Lilly Wachowski'), ('keanu-reeves','Keanu Reeves'), ('laurence-fishburne','Laurence Fishburne'), ('carrie-anne-moss','Carrie-Anne Moss'),
  ('jeff-orlowski','Jeff Orlowski'), ('tristan-harris','Tristan Harris'),
  ('sidney-lumet','Sidney Lumet'), ('henry-fonda','Henry Fonda'), ('lee-j-cobb','Lee J. Cobb'),
  ('roberto-benigni','Roberto Benigni'), ('nicoletta-braschi','Nicoletta Braschi')
on conflict (slug) do nothing;

insert into title_credits (title_id, person_id, role, position)
select t.id, p.id, c.role, c.pos
from (values
  ('o-show-de-truman','peter-weir','direcao',0), ('o-show-de-truman','jim-carrey','elenco',0), ('o-show-de-truman','laura-linney','elenco',1), ('o-show-de-truman','ed-harris','elenco',2),
  ('tempos-modernos','charles-chaplin','direcao',0), ('tempos-modernos','charles-chaplin','elenco',0), ('tempos-modernos','paulette-goddard','elenco',1),
  ('sociedade-dos-poetas-mortos','peter-weir','direcao',0), ('sociedade-dos-poetas-mortos','robin-williams','elenco',0), ('sociedade-dos-poetas-mortos','ethan-hawke','elenco',1),
  ('a-onda','dennis-gansel','direcao',0), ('a-onda','jurgen-vogel','elenco',0),
  ('matrix','lana-wachowski','direcao',0), ('matrix','lilly-wachowski','direcao',1), ('matrix','keanu-reeves','elenco',0), ('matrix','laurence-fishburne','elenco',1), ('matrix','carrie-anne-moss','elenco',2),
  ('o-dilema-das-redes','jeff-orlowski','direcao',0), ('o-dilema-das-redes','tristan-harris','participacao',0),
  ('12-homens-e-uma-sentenca','sidney-lumet','direcao',0), ('12-homens-e-uma-sentenca','henry-fonda','elenco',0), ('12-homens-e-uma-sentenca','lee-j-cobb','elenco',1),
  ('a-vida-e-bela','roberto-benigni','direcao',0), ('a-vida-e-bela','roberto-benigni','elenco',0), ('a-vida-e-bela','nicoletta-braschi','elenco',1)
) as c(tslug, pslug, role, pos)
join titles t on t.slug = c.tslug
join people p on p.slug = c.pslug
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Ligações título × categoria
-- ---------------------------------------------------------------------
insert into title_categories (title_id, category_id)
select t.id, c.id
from (values
  ('o-show-de-truman','cultura-e-sociedade'), ('o-show-de-truman','teoria-do-conhecimento'), ('o-show-de-truman','para-debate'),
  ('o-show-de-truman','platao'), ('o-show-de-truman','debord'), ('o-show-de-truman','foucault'), ('o-show-de-truman','mito-da-caverna'), ('o-show-de-truman','vigilancia'),
  ('tempos-modernos','trabalho-e-capitalismo'), ('tempos-modernos','para-debate'), ('tempos-modernos','marx'), ('tempos-modernos','weber'), ('tempos-modernos','alienacao'),
  ('sociedade-dos-poetas-mortos','educacao'), ('sociedade-dos-poetas-mortos','etica-e-moral'), ('sociedade-dos-poetas-mortos','kant'), ('sociedade-dos-poetas-mortos','thoreau'), ('sociedade-dos-poetas-mortos','esclarecimento'),
  ('a-onda','filosofia-politica'), ('a-onda','direitos-humanos'), ('a-onda','para-debate'), ('a-onda','arendt'), ('a-onda','totalitarismo'), ('a-onda','educacao'),
  ('matrix','teoria-do-conhecimento'), ('matrix','platao'), ('matrix','descartes'), ('matrix','baudrillard'), ('matrix','mito-da-caverna'), ('matrix','duvida-metodica'),
  ('o-dilema-das-redes','cultura-e-sociedade'), ('o-dilema-das-redes','trabalho-e-capitalismo'), ('o-dilema-das-redes','para-debate'), ('o-dilema-das-redes','zuboff'), ('o-dilema-das-redes','bauman'), ('o-dilema-das-redes','vigilancia'),
  ('12-homens-e-uma-sentenca','etica-e-moral'), ('12-homens-e-uma-sentenca','filosofia-politica'), ('12-homens-e-uma-sentenca','direitos-humanos'), ('12-homens-e-uma-sentenca','para-debate'), ('12-homens-e-uma-sentenca','justica'),
  ('a-vida-e-bela','direitos-humanos'), ('a-vida-e-bela','etica-e-moral'), ('a-vida-e-bela','arendt'), ('a-vida-e-bela','banalidade-do-mal')
) as x(tslug, cslug)
join titles t on t.slug = x.tslug
join categories c on c.slug = x.cslug
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Onde assistir: link de busca no JustWatch (agregador de serviços legais).
-- O admin deve trocar por link oficial quando houver.
-- ---------------------------------------------------------------------
insert into watch_sources (title_id, label, url, kind)
select t.id, 'Consultar serviços legais no JustWatch', 'https://www.justwatch.com/br/busca?q=' || replace(t.title, ' ', '%20'), 'agregador'
from titles t
where t.type in ('filme','documentario')
  and not exists (select 1 from watch_sources w where w.title_id = t.id);

-- ---------------------------------------------------------------------
-- Vitrine da home
-- ---------------------------------------------------------------------
insert into rails (slug, name, source, source_value, position, ranked) values
  ('em-alta',            'Em alta nas salas de aula',       'em_alta',      null,                     5,  true),
  ('continuar',          'Continue assistindo',             'continuar',    null,                     10, false),
  ('destaque',           'Em destaque no CineMente',        'destaque',     null,                     15, false),
  ('recomendados',       'Recomendados para você',          'recomendados', null,                     20, false),
  ('recentes',           'Adicionados recentemente',        'recentes',     null,                     30, false),
  ('filosofia',          'Filmes de Filosofia',             'disciplina',   'filosofia',              40, false),
  ('sociologia',         'Filmes de Sociologia',            'disciplina',   'sociologia',             50, false),
  ('documentarios',      'Documentários essenciais',        'tipo',         'documentario',           60, false),
  ('curtas',             'Curtas para trabalhar em sala',   'tipo',         'curta',                  70, false),
  ('filosofia-politica', 'Filosofia política',              'categoria',    'filosofia-politica',     80, false),
  ('etica-e-moral',      'Ética e moral',                   'categoria',    'etica-e-moral',          90, false),
  ('cultura-e-sociedade','Cultura e sociedade',             'categoria',    'cultura-e-sociedade',    100, false),
  ('trabalho',           'Trabalho e capitalismo',          'categoria',    'trabalho-e-capitalismo', 110, false),
  ('direitos-humanos',   'Direitos humanos',                'categoria',    'direitos-humanos',       120, false),
  ('videoaulas',         'Videoaulas recomendadas',         'tipo',         'videoaula',              130, false),
  ('com-guia',           'Conteúdos com plano de aula',     'com_guia',     null,                     140, false),
  ('debates',            'Filmes para debates',             'categoria',    'para-debate',            150, false),
  ('minha-lista',        'Minha lista',                     'minha_lista',  null,                     160, false)
on conflict (slug) do nothing;

insert into notifications (title, body, link)
select 'Bem-vindo ao CineMente', 'Explore as fichas pedagógicas de cada filme na seção "Explore este filme em sala de aula".', '/navegar'
where not exists (select 1 from notifications where title = 'Bem-vindo ao CineMente');
