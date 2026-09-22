with open("ube_snippet.txt", "r") as f:
    text = f.read()

# Let's print about 3000 characters around index 114653
start = 114653 - 1000
end = 114653 + 4000
print(text[start:end])
