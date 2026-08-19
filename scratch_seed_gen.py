import json

with open('c:/Users/SJ/Documents/antigravity/serene-curie/data/activities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sql = []
for act in data:
    name = act.get('name', '').replace("'", "''")
    category = act.get('category', '').replace("'", "''")
    hook = act.get('hook', '').replace("'", "''")
    dims = json.dumps(act.get('dimensions', {})).replace("'", "''")
    prac = json.dumps(act.get('practicalConstraints', {})).replace("'", "''")
    prog = json.dumps(act.get('progression', {})).replace("'", "''")
    exp = json.dumps(act.get('experiment', {})).replace("'", "''")
    sql.append(f"INSERT INTO activities (id, name, category, hook, dimensions, practical_constraints, progression, experiment) VALUES ('{act['id']}', '{name}', '{category}', '{hook}', '{dims}'::jsonb, '{prac}'::jsonb, '{prog}'::jsonb, '{exp}'::jsonb) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, hook=EXCLUDED.hook, dimensions=EXCLUDED.dimensions, practical_constraints=EXCLUDED.practical_constraints, progression=EXCLUDED.progression, experiment=EXCLUDED.experiment;")

with open('c:/Users/SJ/Documents/antigravity/serene-curie/supabase/seed_activities.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))
print('Generated seed_activities.sql')
