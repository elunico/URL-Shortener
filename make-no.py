from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont
import sys

FONT_FILE_NAME = 'RobCon.ttf'
FONT_SIZE_SHRINK_FACTOR = 0.875
FONT_SIZE_MINIMUM = 64

def format_message(ctx, image_width, image_height, message):
    # set initial font size
    font_size = 200
    font = ImageFont.truetype(FONT_FILE_NAME, font_size)
    font_width, font_height = ctx.textsize(message, font=font)

    # assume the intial settings were correct or a small adjustment will fix it
    one_line = True
    while (font_width > image_width):
        if font_size <= FONT_SIZE_MINIMUM:
            # if there is too much text, we will need to split up the text
            one_line = False
            break
        font_size = int(font_size * FONT_SIZE_SHRINK_FACTOR)
        font = ImageFont.truetype(FONT_FILE_NAME, font_size)
        font_width, font_height = ctx.textsize(message, font=font)

    lines = []
    if not one_line:
        # split the text into lines
        words = message.split()
        font = ImageFont.truetype(FONT_FILE_NAME, font_size)
        line = []
        while words:
            # figure out which line to place the next word on
            current = words.pop(0)

            # try putting it on the current line
            line.append(current)

            # find the new line length if it still fits on the image keep going
            font_width, _ = ctx.textsize(' '.join(line), font=font)

            # if the line is too long to fit on the image this line is 'full'
            # and we need to take some action depending on the length of current
            if font_width > image_width:
                # first remove the word that overran this line from the line
                line.pop()
                # the current line is now 'full' so add it to the list of lines
                lines.append(line)
                # reset the working line to be empty for the next line in the image
                line = []

                if ctx.textsize(current, font=font)[0] >= image_width:
                    # if the word itself is larger than a line can be, give up! and give its own line
                    lines.append([current])
                else:
                    # otherwise put it back in the word list so it can be placed on the next line
                    words.insert(0, current)
        if line:
            # if we did not fill the last line but are out of words there will be words in the
            # current line list at the end. We don't want to forget them
            lines.append(line)

    if lines:
        formatted = '\n'.join(' '.join(line) for line in lines)
    else:
        formatted = message
    return formatted, font


def write_text(img, message, outline=(0, 0, 0), fill=(255,255,255)):
    ctx = ImageDraw.Draw(img)
    iwidth, iheight = img.size

    message, font = format_message(ctx, iwidth - 50, iheight, message)
    print("{!r}".format(message))
    print("{!r}".format(font))


    if '\n' in message:
        # left align if multiline
        x = 50
    else:
        # center single lines
        x = (iwidth - ctx.textsize(message, font=font)[0]) / 2

    y = 30

    try:
        if outline:
            ctx.text((x-1, y-1), message, font=font, fill=outline)
            ctx.text((x+1, y-1), message, font=font, fill=outline)
            ctx.text((x-1, y+1), message, font=font, fill=outline)
            ctx.text((x+1, y+1), message, font=font, fill=outline)
    except (IndexError, ValueError):
        raise ValueError('argument outline should be a RGB int 3-tuple or None not {!r}'.format(outline))

    # write the actual text
    ctx.text((x, y), message, fill=(255, 255, 255), font=font)


img = Image.open('/home/thomas/url-shortener/sad-no.png')
write_text(img, 'NO {}?'.format(sys.argv[2].upper()))

print("Saving output")
img.save("/home/thomas/url-shortener/output/{}.png".format(sys.argv[1]))
