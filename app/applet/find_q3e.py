with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

start = 1782427
last_it = text.rfind('InstrumentTable.tsx', start, 2391388)
print('Last InstrumentTable.tsx at:', last_it)
print(text[last_it-100:last_it+300])
