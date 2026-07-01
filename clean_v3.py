suffixes_to_strip = ('.SS', '.SZ', '.HK', '.KS')
with open('downloaded_tickers_v3.txt', 'r') as f:
    lines = f.readlines()

valid_lines = [line for line in lines if not line.strip().endswith(suffixes_to_strip)]

with open('downloaded_tickers_v3.txt', 'w') as f:
    f.writelines(valid_lines)

print(f'Cleaned up downloaded_tickers_v3.txt')
print(f'Original count: {len(lines)}')
print(f'New count: {len(valid_lines)}')
print(f'Removed {len(lines) - len(valid_lines)} invalid tickers.')
