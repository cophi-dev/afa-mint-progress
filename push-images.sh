#!/bin/bash

# Set batch size
BATCH_SIZE=500

# Calculate total number of batches (for 10000 images)
TOTAL_BATCHES=$((10000 / BATCH_SIZE))

# Loop through all batches
for ((batch=0; batch<=TOTAL_BATCHES; batch++)); do
    # Calculate start and end of current batch
    START=$((batch * BATCH_SIZE))
    END=$(((batch + 1) * BATCH_SIZE - 1))
    
    echo "Processing batch $batch (images $START to $END)"
    
    # Add images in current batch
    for ((i=START; i<=END; i++)); do
        if [ -f "public/images/$i.png" ]; then
            git add "public/images/$i.png"
        fi
    done
    
    # Commit and push if there are changes
    if ! git diff --cached --quiet; then
        git commit -m "Add images $START-$END"
        git push
        echo "Pushed images $START-$END"
    else
        echo "No images found in range $START-$END"
    fi
done

echo "All batches processed!"